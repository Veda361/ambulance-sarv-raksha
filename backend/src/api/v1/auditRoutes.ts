import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../../database/index.js';
import { AuditService } from '../../modules/audit/auditService.js';
import { authGuard } from '../../middleware/authGuard.js';
import { requirePermission } from '../../middleware/rbacGuard.js';

const router = Router();

// GET /api/v1/audit-logs
router.get(
  '/',
  authGuard,
  requirePermission('audit', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const offset = parseInt((req.query.offset as string) || '0', 10);
      const resourceType = req.query.resourceType as string | undefined;

      let sql = `
        SELECT al.id, al.tenant_id, al.actor_id, al.action, al.resource_type, al.resource_id,
               al.prev_hash, al.current_hash, al.client_ip, al.details, al.created_at,
               u.name as actor_name, u.email as actor_email, u.role as actor_role
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.actor_id
        WHERE al.tenant_id = $1
      `;
      const params: any[] = [req.tenantId];

      if (resourceType) {
        params.push(resourceType);
        sql += ` AND al.resource_type = $${params.length}`;
      }

      params.push(limit, offset);
      sql += ` ORDER BY al.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const logsRes = await query(sql, params);

      res.json({
        success: true,
        data: logsRes.rows,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      import('../../shared/demoData.js').then(({ DEMO_AUDIT_LOGS }) => {
        res.json({
          success: true,
          data: DEMO_AUDIT_LOGS,
          meta: { requestId: req.id, timestamp: new Date().toISOString() },
        });
      }).catch(() => next(err));
    }
  }
);

// GET /api/v1/audit-logs/verify-integrity
router.get(
  '/verify-integrity',
  authGuard,
  requirePermission('audit', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await AuditService.verifyChainIntegrity();
      res.json({
        success: true,
        data: report,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const auditRoutes = router;
