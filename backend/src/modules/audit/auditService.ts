import crypto from 'crypto';
import { pool, query } from '../../database/index.js';
import { logger } from '../../shared/logger.js';

export interface AuditEntryInput {
  tenantId?: string | null;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  clientIp?: string | null;
  userAgent?: string | null;
  details?: Record<string, any>;
}

export class AuditService {
  private static readonly GENESIS_HASH = '0'.repeat(64);

  public static async record(entry: AuditEntryInput): Promise<string> {
    try {
      // 1. Fetch latest audit entry hash for chaining
      const lastRes = await pool.query(
        'SELECT current_hash FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT 1'
      );
      const prevHash = lastRes.rows.length > 0 ? lastRes.rows[0].current_hash : AuditService.GENESIS_HASH;

      const timestamp = new Date().toISOString();
      const payloadString = JSON.stringify(entry.details || {});

      // 2. Compute SHA-256 hash chain
      const hashContent = `${prevHash}|${entry.tenantId || ''}|${entry.actorId || ''}|${entry.action}|${entry.resourceType}|${entry.resourceId}|${payloadString}|${timestamp}`;
      const currentHash = crypto.createHash('sha256').update(hashContent).digest('hex');

      // 3. Insert append-only record
      const res = await query(
        `INSERT INTO audit_logs 
          (tenant_id, actor_id, action, resource_type, resource_id, prev_hash, current_hash, client_ip, user_agent, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          entry.tenantId || null,
          entry.actorId || null,
          entry.action,
          entry.resourceType,
          entry.resourceId,
          prevHash,
          currentHash,
          entry.clientIp || null,
          entry.userAgent || null,
          entry.details || {},
          timestamp,
        ]
      );

      logger.debug({ auditId: res.rows[0].id, action: entry.action }, 'Recorded immutable audit log');
      return res.rows[0].id;
    } catch (err) {
      logger.error({ err, entry }, 'Failed to record audit log entry');
      throw err;
    }
  }

  public static async verifyChainIntegrity(): Promise<{ valid: boolean; totalRecords: number; brokenAt?: string }> {
    const res = await pool.query('SELECT * FROM audit_logs ORDER BY created_at ASC, id ASC');
    let prevHash = AuditService.GENESIS_HASH;

    for (let i = 0; i < res.rows.length; i++) {
      const row = res.rows[i];
      if (row.prev_hash !== prevHash) {
        return { valid: false, totalRecords: res.rows.length, brokenAt: row.id };
      }
      prevHash = row.current_hash;
    }

    return { valid: true, totalRecords: res.rows.length };
  }
}
