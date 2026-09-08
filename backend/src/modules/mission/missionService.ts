import crypto from 'crypto';
import { query, withTransaction } from '../../database/index.js';
import { NotFoundError, ConflictError } from '../../shared/errors.js';
import { validateStateTransition, MissionState } from './stateMachine.js';
import { UserRole } from '../authorization/permissions.js';
import { eventBus } from '../../shared/events.js';
import { AuditService } from '../audit/auditService.js';
import { realtimeGateway } from '../../realtime/wsGateway.js';

export interface CreateMissionInput {
  tenantId: string;
  patientId?: string;
  ambulanceId: string;
  driverId: string;
  destinationHospitalId: string;
  triageAcuity?: 'RED_CRITICAL' | 'YELLOW_URGENT' | 'GREEN_NON_URGENT' | 'BLACK_EXPECTANT';
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
}

export class MissionService {
  private static generateMissionCode(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `MSN-${dateStr}-${randomHex}`;
  }

  public static async createMission(input: CreateMissionInput, actorId: string, _actorRole: UserRole): Promise<any> {
    const missionCode = this.generateMissionCode();

    return await withTransaction(async (client) => {
      // 1. Verify ambulance belongs to tenant and is available or assigned
      const ambRes = await client.query(
        'SELECT id, status FROM ambulances WHERE id = $1 AND tenant_id = $2',
        [input.ambulanceId, input.tenantId]
      );
      if (ambRes.rows.length === 0) {
        throw new NotFoundError(`Ambulance '${input.ambulanceId}' not found in this tenant`);
      }

      // 2. Insert Mission record
      const res = await client.query(
        `INSERT INTO missions 
          (tenant_id, mission_code, patient_id, ambulance_id, driver_id, destination_hospital_id,
           state, triage_acuity, pickup_latitude, pickup_longitude, pickup_address)
         VALUES ($1, $2, $3, $4, $5, $6, 'REQUESTED', $7, $8, $9, $10)
         RETURNING *`,
        [
          input.tenantId,
          missionCode,
          input.patientId || null,
          input.ambulanceId,
          input.driverId,
          input.destinationHospitalId,
          input.triageAcuity || 'YELLOW_URGENT',
          input.pickupLatitude,
          input.pickupLongitude,
          input.pickupAddress,
        ]
      );

      const mission = res.rows[0];

      // 3. Automatically advance to ASSIGNED per Golden Path
      await client.query(
        "UPDATE missions SET state = 'ASSIGNED', updated_at = NOW() WHERE id = $1",
        [mission.id]
      );
      mission.state = 'ASSIGNED';

      // 4. Update ambulance status
      await client.query(
        "UPDATE ambulances SET status = 'ASSIGNED', updated_at = NOW() WHERE id = $1",
        [input.ambulanceId]
      );

      // 5. Record Mission Event
      await client.query(
        `INSERT INTO mission_events (mission_id, tenant_id, actor_id, event_type, from_state, to_state, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          mission.id,
          input.tenantId,
          actorId,
          'MISSION_ASSIGNED',
          'REQUESTED',
          'ASSIGNED',
          { pickupAddress: input.pickupAddress },
        ]
      );

      // 6. Record Audit Log
      await AuditService.record({
        tenantId: input.tenantId,
        actorId,
        action: 'MISSION_CREATED_AND_ASSIGNED',
        resourceType: 'mission',
        resourceId: mission.id,
        details: { missionCode, ambulanceId: input.ambulanceId, driverId: input.driverId },
      });

      // 7. Publish domain event & Realtime broadcast
      eventBus.publish({
        eventId: crypto.randomUUID(),
        eventType: 'MISSION_ASSIGNED',
        aggregateId: mission.id,
        tenantId: mission.tenant_id,
        actorId,
        occurredAt: new Date().toISOString(),
        payload: { missionId: mission.id, missionCode, driverId: input.driverId },
      });

      realtimeGateway.broadcast(
        `tenant:${input.tenantId}:fleet`,
        'MISSION_ASSIGNED',
        { missionId: mission.id, missionCode, state: 'ASSIGNED' },
        input.tenantId
      );

      return mission;
    });
  }

  public static async transitionState(
    missionId: string,
    targetState: MissionState,
    actorId: string,
    actorRole: UserRole,
    actorTenantId: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return await withTransaction(async (client) => {
      // 1. Fetch current mission
      const res = await client.query(
        'SELECT * FROM missions WHERE id = $1 FOR UPDATE',
        [missionId]
      );
      if (res.rows.length === 0) {
        throw new NotFoundError(`Mission '${missionId}' not found`);
      }

      const mission = res.rows[0];

      // Verify tenant boundary (unless cross-tenant hospital receiving)
      const isOriginTenant = mission.tenant_id === actorTenantId;
      const destHospitalRes = await client.query(
        'SELECT tenant_id FROM hospitals WHERE id = $1',
        [mission.destination_hospital_id]
      );
      const isDestinationTenant = destHospitalRes.rows[0]?.tenant_id === actorTenantId;

      if (!isOriginTenant && !isDestinationTenant && actorRole !== 'SUPER_ADMIN') {
        throw new ConflictError('User is not authorized for this mission tenant');
      }

      // 2. Validate FSM Transition Rules
      validateStateTransition(mission.state, targetState, actorRole);

      // 3. Update Mission State
      let updateSql = 'UPDATE missions SET state = $1, updated_at = NOW()';
      const updateParams: any[] = [targetState];

      if (targetState === 'CANCELLED' && metadata?.cancellationReason) {
        updateParams.push(metadata.cancellationReason);
        updateSql += `, cancellation_reason = $${updateParams.length}`;
      }

      if (targetState === 'COMPLETED') {
        updateParams.push(metadata?.handoverNotes || 'Clinical handover completed successfully');
        updateSql += `, handover_notes = $${updateParams.length}, handover_acknowledged_at = NOW()`;
        if (actorId) {
          updateParams.push(actorId);
          updateSql += `, handover_acknowledged_by = $${updateParams.length}`;
        }
      }

      updateParams.push(missionId);
      updateSql += ` WHERE id = $${updateParams.length} RETURNING *`;

      const updatedRes = await client.query(updateSql, updateParams);
      const updatedMission = updatedRes.rows[0];

      // 4. Update linked vehicle status appropriately
      let newAmbulanceStatus = 'AVAILABLE';
      if (['ACCEPTED', 'EN_ROUTE_TO_PICKUP'].includes(targetState)) {
        newAmbulanceStatus = 'EN_ROUTE';
      } else if (['ARRIVED_PICKUP', 'PATIENT_ONBOARD'].includes(targetState)) {
        newAmbulanceStatus = 'ON_SCENE';
      } else if (['EN_ROUTE_TO_HOSPITAL'].includes(targetState)) {
        newAmbulanceStatus = 'TRANSPORTING';
      } else if (['ARRIVED_HOSPITAL', 'HANDOVER'].includes(targetState)) {
        newAmbulanceStatus = 'AT_HOSPITAL';
      } else if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(targetState)) {
        newAmbulanceStatus = 'AVAILABLE';
      }

      await client.query(
        'UPDATE ambulances SET status = $1, updated_at = NOW() WHERE id = $2',
        [newAmbulanceStatus, mission.ambulance_id]
      );

      // 5. Record Mission Event
      await client.query(
        `INSERT INTO mission_events (mission_id, tenant_id, actor_id, event_type, from_state, to_state, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          missionId,
          mission.tenant_id,
          actorId,
          `MISSION_${targetState}`,
          mission.state,
          targetState,
          metadata || {},
        ]
      );

      // 6. Record Audit Log
      await AuditService.record({
        tenantId: mission.tenant_id,
        actorId,
        action: `MISSION_TRANSITION_${targetState}`,
        resourceType: 'mission',
        resourceId: missionId,
        details: { fromState: mission.state, toState: targetState, metadata },
      });

      // 7. Publish Domain Event
      eventBus.publish({
        eventId: crypto.randomUUID(),
        eventType: `MISSION_${targetState}`,
        aggregateId: missionId,
        tenantId: mission.tenant_id,
        actorId,
        occurredAt: new Date().toISOString(),
        payload: { missionId, fromState: mission.state, toState: targetState },
      });

      // 8. Realtime Broadcast
      realtimeGateway.broadcast(
        `mission:${missionId}:telemetry`,
        'STATE_CHANGED',
        { missionId, fromState: mission.state, toState: targetState }
      );

      // Broadcast to hospital radar if en-route to hospital or arriving
      if (['PATIENT_ONBOARD', 'EN_ROUTE_TO_HOSPITAL', 'ARRIVED_HOSPITAL', 'HANDOVER'].includes(targetState)) {
        realtimeGateway.broadcast(
          `hospital:${mission.destination_hospital_id}:radar`,
          'HOSPITAL_PRE_ARRIVAL_UPDATE',
          {
            missionId,
            missionCode: mission.mission_code,
            state: targetState,
            triageAcuity: mission.triage_acuity,
            ambulanceId: mission.ambulance_id,
          }
        );
      }

      return updatedMission;
    });
  }

  public static async getMissionById(missionId: string, tenantId: string, userRole: UserRole, _hospitalId?: string): Promise<any> {
    const res = await query(
      `SELECT m.*, 
              a.call_sign as ambulance_call_sign, a.registration_number as ambulance_reg_number,
              h.name as destination_hospital_name, h.address as destination_hospital_address,
              p.name as patient_name, p.age as patient_age, p.gender as patient_gender, p.chief_complaint as patient_complaint
       FROM missions m
       JOIN ambulances a ON a.id = m.ambulance_id
       JOIN hospitals h ON h.id = m.destination_hospital_id
       LEFT JOIN patients p ON p.id = m.patient_id
       WHERE m.id = $1`,
      [missionId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Mission '${missionId}' not found`);
    }

    const mission = res.rows[0];

    // Multi-tenant check with cross-tenant destination hospital envelope
    const isOriginTenant = mission.tenant_id === tenantId;
    const destHospitalRes = await query('SELECT tenant_id FROM hospitals WHERE id = $1', [mission.destination_hospital_id]);
    const isDestinationTenant = destHospitalRes.rows[0]?.tenant_id === tenantId;

    if (!isOriginTenant && !isDestinationTenant && userRole !== 'SUPER_ADMIN') {
      throw new NotFoundError(`Mission '${missionId}' not found in this organization`);
    }

    // Zero-PHI protection: redact patient info if user role does not have patient access
    if (['DRIVER', 'SUPER_ADMIN', 'GOVERNMENT_OPERATOR'].includes(userRole)) {
      delete mission.patient_name;
      delete mission.patient_complaint;
    }

    return mission;
  }

  public static async listMissions(tenantId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const res = await query(
      `SELECT m.*, a.call_sign, h.name as hospital_name
       FROM missions m
       JOIN ambulances a ON a.id = m.ambulance_id
       JOIN hospitals h ON h.id = m.destination_hospital_id
       WHERE m.tenant_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
    return res.rows;
  }
}
