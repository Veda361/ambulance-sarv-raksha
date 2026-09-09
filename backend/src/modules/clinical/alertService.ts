import { query } from '../../database/index.js';
import { NotFoundError } from '../../shared/errors.js';
import { AuditService } from '../audit/auditService.js';
import { realtimeGateway } from '../../realtime/wsGateway.js';

export interface ListAlertsOptions {
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isAcknowledged?: boolean;
  limit?: number;
  offset?: number;
}

export class AlertService {
  public static async listAlerts(tenantId: string, options: ListAlertsOptions = {}): Promise<any[]> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    let sql = `
      SELECT al.*, 
             m.mission_code, m.state as mission_state, m.triage_acuity,
             a.call_sign as ambulance_call_sign,
             u.name as acknowledged_by_name
      FROM alerts al
      JOIN missions m ON m.id = al.mission_id
      JOIN ambulances a ON a.id = m.ambulance_id
      LEFT JOIN users u ON u.id = al.acknowledged_by
      WHERE al.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (options.severity) {
      params.push(options.severity);
      sql += ` AND al.severity = $${params.length}`;
    }

    if (options.isAcknowledged !== undefined) {
      params.push(options.isAcknowledged);
      sql += ` AND al.is_acknowledged = $${params.length}`;
    }

    params.push(limit, offset);
    sql += ` ORDER BY al.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const res = await query(sql, params);
    return res.rows;
  }

  public static async acknowledgeAlert(alertId: string, tenantId: string, actorId: string): Promise<any> {
    const res = await query(
      `UPDATE alerts 
       SET is_acknowledged = true, acknowledged_by = $1, acknowledged_at = NOW() 
       WHERE id = $2 AND tenant_id = $3 
       RETURNING *`,
      [actorId, alertId, tenantId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Alert '${alertId}' not found in this tenant`);
    }

    const alert = res.rows[0];

    // Audit log entry
    await AuditService.record({
      tenantId,
      actorId,
      action: 'OPERATIONAL_ALERT_ACKNOWLEDGED',
      resourceType: 'alert',
      resourceId: alertId,
      details: { severity: alert.severity, alertType: alert.alert_type },
    });

    // Realtime broadcast
    realtimeGateway.broadcast(
      `tenant:${tenantId}:fleet`,
      'ALERT_ACKNOWLEDGED',
      { alertId, acknowledgedBy: actorId, acknowledgedAt: alert.acknowledged_at },
      tenantId
    );

    return alert;
  }
}
