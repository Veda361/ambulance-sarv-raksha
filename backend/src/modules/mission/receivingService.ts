import { query, withTransaction } from '../../database/index.js';
import { NotFoundError, AuthorizationError, ValidationError } from '../../shared/errors.js';
import { UserRole } from '../authorization/permissions.js';
import { AuditService } from '../audit/auditService.js';
import { MissionService } from './missionService.js';
import { realtimeGateway } from '../../realtime/wsGateway.js';

export class ReceivingService {
  public static async listInboundMissions(tenantId: string, hospitalId?: string): Promise<any[]> {
    let sql = `
      SELECT m.id, m.mission_code, m.state, m.triage_acuity, m.pickup_address,
             m.pickup_latitude, m.pickup_longitude, m.current_eta_seconds,
             m.receiving_acknowledged_at, m.receiving_acknowledged_by,
             m.receiving_prepared_at, m.handover_notes,
             m.created_at, m.updated_at,
             a.id as ambulance_id, a.call_sign as ambulance_call_sign, a.capability as ambulance_capability,
             a.current_latitude as ambulance_latitude, a.current_longitude as ambulance_longitude,
             a.updated_at as ambulance_last_seen,
             h.id as destination_hospital_id, h.name as destination_hospital_name,
             p.id as patient_id, p.name as patient_name, p.age as patient_age, p.gender as patient_gender,
             p.chief_complaint as patient_complaint,
             v.heart_rate, v.spo2_percent, v.systolic_bp, v.diastolic_bp, v.respiratory_rate,
             v.temperature_c, v.news2_score, v.recorded_at as vitals_recorded_at
      FROM missions m
      JOIN ambulances a ON a.id = m.ambulance_id
      JOIN hospitals h ON h.id = m.destination_hospital_id
      LEFT JOIN patients p ON p.id = m.patient_id
      LEFT JOIN LATERAL (
        SELECT * FROM vital_measurements vm 
        WHERE vm.mission_id = m.id 
        ORDER BY vm.recorded_at DESC LIMIT 1
      ) v ON true
      WHERE h.tenant_id = $1
        AND m.state IN ('PATIENT_ONBOARD', 'EN_ROUTE_TO_HOSPITAL', 'ARRIVED_HOSPITAL', 'HANDOVER')
    `;

    const params: any[] = [tenantId];
    if (hospitalId) {
      params.push(hospitalId);
      sql += ` AND m.destination_hospital_id = $2`;
    }

    sql += ` ORDER BY m.current_eta_seconds ASC NULLS LAST, m.updated_at DESC`;

    const res = await query(sql, params);
    return res.rows;
  }

  public static async acknowledgeInboundMission(
    missionId: string,
    actorId: string,
    actorTenantId: string,
    actorRole: UserRole
  ): Promise<any> {
    return await withTransaction(async (client) => {
      const res = await client.query(
        `SELECT m.*, h.tenant_id as dest_tenant_id 
         FROM missions m 
         JOIN hospitals h ON h.id = m.destination_hospital_id 
         WHERE m.id = $1 FOR UPDATE`,
        [missionId]
      );

      if (res.rows.length === 0) {
        throw new NotFoundError(`Mission '${missionId}' not found`);
      }

      const mission = res.rows[0];
      if (mission.dest_tenant_id !== actorTenantId && actorRole !== 'SUPER_ADMIN') {
        throw new AuthorizationError('Only the designated destination receiving hospital can acknowledge this mission');
      }

      const updateRes = await client.query(
        `UPDATE missions 
         SET receiving_acknowledged_at = NOW(), receiving_acknowledged_by = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [actorId, missionId]
      );

      const updated = updateRes.rows[0];

      // Record Mission Event
      await client.query(
        `INSERT INTO mission_events (mission_id, tenant_id, actor_id, event_type, from_state, to_state, metadata)
         VALUES ($1, $2, $3, 'RECEIVING_ACKNOWLEDGED', $4, $4, $5)`,
        [missionId, mission.tenant_id, actorId, mission.state, { acknowledgedBy: actorId }]
      );

      // Record Audit Log
      await AuditService.record({
        tenantId: actorTenantId,
        actorId,
        action: 'RECEIVING_INBOUND_ACKNOWLEDGED',
        resourceType: 'mission',
        resourceId: missionId,
        details: { destinationHospitalId: mission.destination_hospital_id },
      });

      // Broadcast update
      realtimeGateway.broadcast(
        `hospital:${mission.destination_hospital_id}:radar`,
        'RECEIVING_ACKNOWLEDGED',
        { missionId, acknowledgedAt: updated.receiving_acknowledged_at, acknowledgedBy: actorId }
      );

      return updated;
    });
  }

  public static async markFacilityPrepared(
    missionId: string,
    actorId: string,
    actorTenantId: string,
    actorRole: UserRole
  ): Promise<any> {
    return await withTransaction(async (client) => {
      const res = await client.query(
        `SELECT m.*, h.tenant_id as dest_tenant_id 
         FROM missions m 
         JOIN hospitals h ON h.id = m.destination_hospital_id 
         WHERE m.id = $1 FOR UPDATE`,
        [missionId]
      );

      if (res.rows.length === 0) {
        throw new NotFoundError(`Mission '${missionId}' not found`);
      }

      const mission = res.rows[0];
      if (mission.dest_tenant_id !== actorTenantId && actorRole !== 'SUPER_ADMIN') {
        throw new AuthorizationError('Only the designated destination receiving hospital can mark facility prepared');
      }

      const updateRes = await client.query(
        `UPDATE missions 
         SET receiving_prepared_at = NOW(), receiving_prepared_by = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [actorId, missionId]
      );

      const updated = updateRes.rows[0];

      // Record Mission Event
      await client.query(
        `INSERT INTO mission_events (mission_id, tenant_id, actor_id, event_type, from_state, to_state, metadata)
         VALUES ($1, $2, $3, 'RECEIVING_FACILITY_PREPARED', $4, $4, $5)`,
        [missionId, mission.tenant_id, actorId, mission.state, { preparedBy: actorId }]
      );

      // Record Audit Log
      await AuditService.record({
        tenantId: actorTenantId,
        actorId,
        action: 'RECEIVING_FACILITY_PREPARED',
        resourceType: 'mission',
        resourceId: missionId,
        details: { destinationHospitalId: mission.destination_hospital_id },
      });

      // Broadcast update
      realtimeGateway.broadcast(
        `hospital:${mission.destination_hospital_id}:radar`,
        'RECEIVING_PREPARED',
        { missionId, preparedAt: updated.receiving_prepared_at, preparedBy: actorId }
      );

      return updated;
    });
  }

  public static async completeHandover(
    missionId: string,
    actorId: string,
    actorTenantId: string,
    actorRole: UserRole,
    handoverNotes: string
  ): Promise<any> {
    if (!handoverNotes || handoverNotes.trim().length < 5) {
      throw new ValidationError('Handover notes must be at least 5 characters long');
    }

    const missionRes = await query('SELECT state FROM missions WHERE id = $1', [missionId]);
    if (missionRes.rows.length === 0) {
      throw new NotFoundError(`Mission '${missionId}' not found`);
    }

    let currentState = missionRes.rows[0].state;

    // Advance to HANDOVER if currently in ARRIVED_HOSPITAL
    if (currentState === 'ARRIVED_HOSPITAL') {
      await MissionService.transitionState(
        missionId,
        'HANDOVER',
        actorId,
        actorRole,
        actorTenantId,
        { handoverNotes }
      );
      currentState = 'HANDOVER';
    }

    if (currentState !== 'HANDOVER') {
      throw new ValidationError(`Cannot complete handover while mission is in state: ${currentState}`);
    }

    // Finalize mission transition to COMPLETED
    return await MissionService.transitionState(
      missionId,
      'COMPLETED',
      actorId,
      actorRole,
      actorTenantId,
      { handoverNotes }
    );
  }
}
