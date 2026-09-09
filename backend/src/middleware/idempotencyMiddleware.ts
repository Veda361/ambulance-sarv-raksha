import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { pool } from '../database/index.js';
import { logger } from '../shared/logger.js';

export function idempotencyMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;

    // Only apply to mutating requests with an Idempotency-Key
    if (!idempotencyKey || !['POST', 'PATCH', 'PUT'].includes(req.method)) {
      return next();
    }

    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      // Must be authenticated to associate idempotency with a tenant
      return next();
    }

    const paramsHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body || {}))
      .digest('hex');

    try {
      const existing = await pool.query(
        `SELECT response_status, response_body 
         FROM idempotency_keys 
         WHERE key = $1 AND tenant_id = $2 AND expires_at > NOW()`,
        [idempotencyKey, tenantId]
      );

      if (existing.rows.length > 0) {
        const cached = existing.rows[0];
        logger.info(
          { idempotencyKey, path: req.path, tenantId },
          'Returning cached idempotent response'
        );
        res.setHeader('X-Idempotent-Replay', 'true');
        res.status(cached.response_status).json(cached.response_body);
        return;
      }

      // Intercept res.json to capture and store the response
      const originalJson = res.json.bind(res);
      res.json = (body: any): Response => {
        // Only cache successful or client-error responses (not 5xx server failures)
        if (res.statusCode < 500) {
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour retention
          pool.query(
            `INSERT INTO idempotency_keys 
              (key, tenant_id, request_path, params_hash, response_status, response_body, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (key) DO UPDATE 
             SET response_status = EXCLUDED.response_status,
                 response_body = EXCLUDED.response_body,
                 expires_at = EXCLUDED.expires_at`,
            [
              idempotencyKey,
              tenantId,
              req.path,
              paramsHash,
              res.statusCode,
              body,
              expiresAt,
            ]
          ).catch((err) => {
            logger.warn({ err, idempotencyKey }, 'Failed to persist idempotency record');
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      logger.warn({ err, idempotencyKey }, 'Idempotency lookup failed, continuing without cache');
      next();
    }
  };
}
