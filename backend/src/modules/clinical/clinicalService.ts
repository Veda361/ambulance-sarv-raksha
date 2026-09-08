import { query, withTransaction } from '../../database/index.js';
import { calculateNEWS2, VitalInput } from './news2.js';
import { realtimeGateway } from '../../realtime/wsGateway.js';
import { AuditService } from '../audit/auditService.js';
import { eventBus } from '../../shared/events.js';
import crypto from 'crypto';

export interface RecordVitalsInput extends VitalInput {
  missionId: string;
  patientId: string;
  tenantId: string;
  recordedAt: string;
}

export class ClinicalService {
  public static async recordVitals(input: RecordVitalsInput, actorId?: string): Promise<any> {
    const news2 = calculateNEWS2(input);

    return await withTransaction(async (client) => {
      // 1. Insert time-series vital measurement
      const res = await client.query(
        `INSERT INTO vital_measurements 
          (mission_id, patient_id, tenant_id, heart_rate, spo2_percent, systolic_bp, diastolic_bp, 
           respiratory_rate, temperature_c, news2_score, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          input.missionId,
          input.patientId,
          input.tenantId,
          input.heartRate || null,
          input.spo2Percent || null,
          input.systolicBp || null,
          input.diastolicBp || null,
          input.respiratoryRate || null,
          input.temperatureC || null,
          news2.totalScore,
          input.recordedAt,
        ]
      );

      const vital = res.rows[0];

      // 2. If Critical Alert (NEWS2 >= 7 or Red Flag triggered), create Alert
      let alertRecord = null;
      if (news2.isCriticalAlert) {
        const alertMsg = `Critical Early Warning Score NEWS2: ${news2.totalScore}. ${news2.redFlags.join(', ')}`;
        const alertRes = await client.query(
          `INSERT INTO alerts (mission_id, tenant_id, alert_type, severity, message)
           VALUES ($1, $2, 'NEWS2_DETERIORATION', 'CRITICAL', $3)
           RETURNING *`,
          [input.missionId, input.tenantId, alertMsg]
        );
        alertRecord = alertRes.rows[0];

        // Record in Audit Log
        await AuditService.record({
          tenantId: input.tenantId,
          actorId,
          action: 'CLINICAL_CRITICAL_ALERT_TRIGGERED',
          resourceType: 'alert',
          resourceId: alertRecord.id,
          details: { news2Score: news2.totalScore, redFlags: news2.redFlags },
        });

        // Publish Alert Domain Event
        eventBus.publish({
          eventId: crypto.randomUUID(),
          eventType: 'ALERT_TRIGGERED',
          aggregateId: input.missionId,
          tenantId: input.tenantId,
          actorId,
          occurredAt: new Date().toISOString(),
          payload: { alertId: alertRecord.id, news2Score: news2.totalScore, redFlags: news2.redFlags },
        });

        // Broadcast high-priority alert to receiving hospital
        const missionRes = await client.query(
          'SELECT destination_hospital_id, mission_code FROM missions WHERE id = $1',
          [input.missionId]
        );
        if (missionRes.rows.length > 0) {
          const destHospitalId = missionRes.rows[0].destination_hospital_id;
          realtimeGateway.broadcast(
            `hospital:${destHospitalId}:radar`,
            'CRITICAL_VITAL_ALERT',
            {
              missionId: input.missionId,
              missionCode: missionRes.rows[0].mission_code,
              news2Score: news2.totalScore,
              alertId: alertRecord.id,
              redFlags: news2.redFlags,
              vitals: input,
            }
          );
        }
      }

      // 3. Broadcast standard vitals update on mission telemetry channel
      realtimeGateway.broadcast(
        `mission:${input.missionId}:telemetry`,
        'VITALS_UPDATED',
        {
          missionId: input.missionId,
          news2Score: news2.totalScore,
          acuityLevel: news2.acuityLevel,
          vitals: input,
        }
      );

      return {
        vital,
        news2,
        alert: alertRecord,
      };
    });
  }

  public static async getLatestVitals(missionId: string, _tenantId: string): Promise<any> {
    const res = await query(
      'SELECT * FROM vital_measurements WHERE mission_id = $1 ORDER BY recorded_at DESC LIMIT 1',
      [missionId]
    );
    return res.rows[0] || null;
  }
}
