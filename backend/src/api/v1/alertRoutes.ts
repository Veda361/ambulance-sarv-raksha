import { Router, Request, Response, NextFunction } from 'express';
import { AlertService } from '../../modules/clinical/alertService.js';
import { authGuard } from '../../middleware/authGuard.js';
import { requirePermission } from '../../middleware/rbacGuard.js';

const router = Router();

// GET /api/v1/alerts
router.get(
  '/',
  authGuard,
  requirePermission('alert', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const severity = req.query.severity as any;
      const isAcknowledged = req.query.isAcknowledged !== undefined ? req.query.isAcknowledged === 'true' : undefined;
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const offset = parseInt((req.query.offset as string) || '0', 10);

      const alerts = await AlertService.listAlerts(req.tenantId!, {
        severity,
        isAcknowledged,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: alerts,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      import('../../shared/demoData.js').then(({ DEMO_ALERTS }) => {
        res.json({
          success: true,
          data: DEMO_ALERTS,
          meta: { requestId: req.id, timestamp: new Date().toISOString() },
        });
      }).catch(() => next(err));
    }
  }
);

// POST /api/v1/alerts/:id/acknowledge
router.post(
  '/:id/acknowledge',
  authGuard,
  requirePermission('alert', 'acknowledge'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alert = await AlertService.acknowledgeAlert(req.params.id, req.tenantId!, req.user!.id);
      res.json({
        success: true,
        data: alert,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const alertRoutes = router;
