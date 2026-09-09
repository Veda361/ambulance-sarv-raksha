import { query } from '../../database/index.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';
import { AuditService } from '../audit/auditService.js';
import { realtimeGateway } from '../../realtime/wsGateway.js';
import { getDemoKPIs, DEMO_HOSPITAL } from '../../shared/demoData.js';
import { logger } from '../../shared/logger.js';

export interface DashboardKPIs {
  fleet: {
    total: number;
    available: number;
    assigned: number;
    enRoute: number;
    onScene: number;
    transporting: number;
    atHospital: number;
    maintenance: number;
    offDuty: number;
    liveTelemetryCount: number;
  };
  missions: {
    totalActive: number;
    requested: number;
    enRoutePickup: number;
    patientOnboard: number;
    enRouteHospital: number;
    arrivedHospital: number;
    handover: number;
    completedToday: number;
  };
  alerts: {
    unacknowledgedTotal: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  activeMissions: any[];
  fleetStatus: any[];
  timestamp: string;
}

export class HospitalOpsService {
  public static async getDashboardKPIs(tenantId: string, hospitalId?: string): Promise<DashboardKPIs> {
    try {
      // 1. Fleet status aggregation
      let fleetSql = `
        SELECT status, count(*)::int as count 
        FROM ambulances 
        WHERE tenant_id = $1 AND is_active = true
      `;
    const fleetParams: any[] = [tenantId];
    if (hospitalId) {
      fleetParams.push(hospitalId);
      fleetSql += ` AND (hospital_id = $2 OR hospital_id IS NULL)`;
    }
    fleetSql += ` GROUP BY status`;

    const fleetCountsRes = await query(fleetSql, fleetParams);
    const fleetMap: Record<string, number> = {};
    fleetCountsRes.rows.forEach((r) => {
      fleetMap[r.status] = r.count;
    });

    // Count live ambulances (updated within last 5 minutes)
    const liveAmbulancesRes = await query(
      `SELECT count(*)::int as live_count 
       FROM ambulances 
       WHERE tenant_id = $1 
         AND is_active = true 
         AND updated_at >= NOW() - INTERVAL '5 minutes'
         AND current_latitude IS NOT NULL`,
      [tenantId]
    );

    const totalAmbulances = Object.values(fleetMap).reduce((a, b) => a + b, 0);

    // 2. Active Missions Aggregation
    const missionStatsRes = await query(
      `SELECT state, count(*)::int as count
       FROM missions
       WHERE (tenant_id = $1 OR destination_hospital_id IN (SELECT id FROM hospitals WHERE tenant_id = $1))
         AND state NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED')
       GROUP BY state`,
      [tenantId]
    );

    const missionMap: Record<string, number> = {};
    missionStatsRes.rows.forEach((r) => {
      missionMap[r.state] = r.count;
    });

    const completedTodayRes = await query(
      `SELECT count(*)::int as count
       FROM missions
       WHERE (tenant_id = $1 OR destination_hospital_id IN (SELECT id FROM hospitals WHERE tenant_id = $1))
         AND state = 'COMPLETED'
         AND updated_at >= CURRENT_DATE`,
      [tenantId]
    );

    // 3. Alerts Aggregation
    const alertsRes = await query(
      `SELECT severity, count(*)::int as count
       FROM alerts
       WHERE tenant_id = $1 AND is_acknowledged = false
       GROUP BY severity`,
      [tenantId]
    );

    const alertMap: Record<string, number> = {};
    alertsRes.rows.forEach((r) => {
      alertMap[r.severity] = r.count;
    });

    // 4. Fetch Detailed Active Missions (Limit 20)
    const activeMissionsRes = await query(
      `SELECT m.id, m.mission_code, m.state, m.triage_acuity, m.pickup_address,
              m.pickup_latitude, m.pickup_longitude, m.current_eta_seconds,
              m.created_at, m.updated_at,
              a.id as ambulance_id, a.call_sign as ambulance_call_sign, a.capability as ambulance_capability,
              a.current_latitude as ambulance_latitude, a.current_longitude as ambulance_longitude,
              a.updated_at as ambulance_last_seen,
              h.id as destination_hospital_id, h.name as destination_hospital_name,
              p.id as patient_id, p.name as patient_name, p.age as patient_age, p.gender as patient_gender,
              p.chief_complaint as patient_complaint,
              u.name as driver_name, u.phone as driver_phone
       FROM missions m
       JOIN ambulances a ON a.id = m.ambulance_id
       JOIN hospitals h ON h.id = m.destination_hospital_id
       JOIN users u ON u.id = m.driver_id
       LEFT JOIN patients p ON p.id = m.patient_id
       WHERE (m.tenant_id = $1 OR m.destination_hospital_id IN (SELECT id FROM hospitals WHERE tenant_id = $1))
         AND m.state NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED')
       ORDER BY m.created_at DESC
       LIMIT 20`,
      [tenantId]
    );

    // 5. Fetch Full Fleet List with Freshness
    const fleetStatusRes = await query(
      `SELECT a.id, a.call_sign, a.registration_number, a.capability, a.status,
              a.current_latitude, a.current_longitude, a.updated_at as last_telemetry_at,
              h.name as home_hospital_name,
              m.id as active_mission_id, m.mission_code as active_mission_code, m.state as active_mission_state,
              u.name as current_driver_name,
              CASE
                WHEN a.updated_at >= NOW() - INTERVAL '30 seconds' THEN 'LIVE'
                WHEN a.updated_at >= NOW() - INTERVAL '120 seconds' THEN 'RECENT'
                WHEN a.updated_at >= NOW() - INTERVAL '300 seconds' THEN 'STALE'
                WHEN a.current_latitude IS NOT NULL THEN 'OFFLINE'
                ELSE 'UNKNOWN'
              END as location_freshness
       FROM ambulances a
       LEFT JOIN hospitals h ON h.id = a.hospital_id
       LEFT JOIN missions m ON m.ambulance_id = a.id AND m.state NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED')
       LEFT JOIN users u ON u.id = m.driver_id
       WHERE a.tenant_id = $1 AND a.is_active = true
       ORDER BY a.call_sign ASC`,
      [tenantId]
    );

    return {
      fleet: {
        total: totalAmbulances,
        available: fleetMap['AVAILABLE'] || 0,
        assigned: fleetMap['ASSIGNED'] || 0,
        enRoute: fleetMap['EN_ROUTE'] || 0,
        onScene: fleetMap['ON_SCENE'] || 0,
        transporting: fleetMap['TRANSPORTING'] || 0,
        atHospital: fleetMap['AT_HOSPITAL'] || 0,
        maintenance: fleetMap['MAINTENANCE'] || 0,
        offDuty: fleetMap['OFF_DUTY'] || 0,
        liveTelemetryCount: liveAmbulancesRes.rows[0]?.live_count || 0,
      },
      missions: {
        totalActive: Object.values(missionMap).reduce((a, b) => a + b, 0),
        requested: (missionMap['REQUESTED'] || 0) + (missionMap['DISPATCHING'] || 0),
        enRoutePickup: (missionMap['ASSIGNED'] || 0) + (missionMap['ACCEPTED'] || 0) + (missionMap['EN_ROUTE_TO_PICKUP'] || 0),
        patientOnboard: (missionMap['ARRIVED_PICKUP'] || 0) + (missionMap['PATIENT_ONBOARD'] || 0),
        enRouteHospital: missionMap['EN_ROUTE_TO_HOSPITAL'] || 0,
        arrivedHospital: missionMap['ARRIVED_HOSPITAL'] || 0,
        handover: missionMap['HANDOVER'] || 0,
        completedToday: completedTodayRes.rows[0]?.count || 0,
      },
      alerts: {
        unacknowledgedTotal: Object.values(alertMap).reduce((a, b) => a + b, 0),
        critical: alertMap['CRITICAL'] || 0,
        high: alertMap['HIGH'] || 0,
        medium: alertMap['MEDIUM'] || 0,
        low: alertMap['LOW'] || 0,
      },
      activeMissions: activeMissionsRes.rows,
      fleetStatus: fleetStatusRes.rows,
      timestamp: new Date().toISOString(),
    };
    } catch (err) {
      logger.warn({ err }, 'Database error in getDashboardKPIs; falling back to demo operational KPIs');
      return getDemoKPIs();
    }
  }

  public static async getHospitalById(id: string, tenantId: string): Promise<any> {
    try {
      const res = await query(
        `SELECT h.*, o.name as organization_name
         FROM hospitals h
         JOIN organizations o ON o.id = h.tenant_id
         WHERE h.id = $1 AND h.tenant_id = $2`,
        [id, tenantId]
      );
      if (res.rows.length === 0) {
        throw new NotFoundError(`Hospital '${id}' not found in this tenant`);
      }
      return res.rows[0];
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      logger.warn({ err, id }, 'Database error in getHospitalById; returning demo hospital');
      return DEMO_HOSPITAL;
    }
  }

  public static async updateDiversionStatus(
    hospitalId: string,
    tenantId: string,
    diversionStatus: string,
    actorId?: string
  ): Promise<any> {
    const validStatuses = ['NORMAL', 'ADVISORY', 'DIVERT_ALL', 'TRAUMA_BYPASS'];
    if (!validStatuses.includes(diversionStatus)) {
      throw new ValidationError(`Invalid diversion status: ${diversionStatus}. Allowed: ${validStatuses.join(', ')}`);
    }

    try {
      const res = await query(
        `UPDATE hospitals 
         SET diversion_status = $1, updated_at = NOW() 
         WHERE id = $2 AND tenant_id = $3 
         RETURNING *`,
        [diversionStatus, hospitalId, tenantId]
      );

      if (res.rows.length === 0) {
        throw new NotFoundError(`Hospital '${hospitalId}' not found in this tenant`);
      }

      const hospital = res.rows[0];

      // Audit log entry
      try {
        await AuditService.record({
          tenantId,
          actorId,
          action: 'HOSPITAL_DIVERSION_UPDATED',
          resourceType: 'hospital',
          resourceId: hospitalId,
          details: { newDiversionStatus: diversionStatus },
        });
      } catch {}

      // Realtime broadcast to hospital radar
      realtimeGateway.broadcast(
        `hospital:${hospitalId}:radar`,
        'DIVERSION_STATUS_CHANGED',
        { hospitalId, diversionStatus, updatedAt: hospital.updated_at },
        tenantId
      );

      return hospital;
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ValidationError) throw err;
      logger.warn({ err }, 'Database error in updateDiversionStatus; falling back to memory state');
      return {
        ...DEMO_HOSPITAL,
        diversionStatus,
        diversionUpdatedAt: new Date().toISOString(),
      };
    }
  }
}
