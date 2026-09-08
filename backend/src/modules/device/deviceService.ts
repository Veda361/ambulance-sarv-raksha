import crypto from 'crypto';
import { query } from '../../database/index.js';
import { ConflictError, AuthenticationError } from '../../shared/errors.js';
import { AuditService } from '../audit/auditService.js';

export interface RegisterDeviceInput {
  tenantId: string;
  ambulanceId?: string;
  deviceIdentifier: string;
  deviceType: string;
}

export class DeviceService {
  public static async registerDevice(input: RegisterDeviceInput, actorId?: string): Promise<{ device: any; apiKey: string }> {
    const existing = await query(
      'SELECT id FROM devices WHERE device_identifier = $1',
      [input.deviceIdentifier]
    );
    if (existing.rows.length > 0) {
      throw new ConflictError(`Device with identifier '${input.deviceIdentifier}' already registered`);
    }

    const rawApiKey = `dev_${crypto.randomBytes(24).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    const res = await query(
      `INSERT INTO devices (tenant_id, ambulance_id, device_identifier, device_type, api_key_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tenant_id, ambulance_id, device_identifier, device_type, status, created_at`,
      [input.tenantId, input.ambulanceId || null, input.deviceIdentifier, input.deviceType, apiKeyHash]
    );

    const device = res.rows[0];

    await AuditService.record({
      tenantId: input.tenantId,
      actorId,
      action: 'DEVICE_REGISTERED',
      resourceType: 'device',
      resourceId: device.id,
      details: { deviceIdentifier: input.deviceIdentifier, deviceType: input.deviceType },
    });

    return { device, apiKey: rawApiKey };
  }

  public static async authenticateDevice(deviceIdentifier: string, apiKey: string): Promise<any> {
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const res = await query(
      `SELECT d.*, a.call_sign
       FROM devices d
       LEFT JOIN ambulances a ON a.id = d.ambulance_id
       WHERE d.device_identifier = $1 AND d.api_key_hash = $2 AND d.status = 'ACTIVE'`,
      [deviceIdentifier, apiKeyHash]
    );

    if (res.rows.length === 0) {
      throw new AuthenticationError('Invalid device credentials or device revoked');
    }

    // Update heartbeat
    await query('UPDATE devices SET last_heartbeat_at = NOW() WHERE id = $1', [res.rows[0].id]);

    return res.rows[0];
  }
}
