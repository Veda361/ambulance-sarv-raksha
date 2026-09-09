import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ReceivingService } from '../../modules/mission/receivingService.js';
import { authGuard } from '../../middleware/authGuard.js';
import { requirePermission } from '../../middleware/rbacGuard.js';

const router = Router();

const handoverSchema = z.object({
  handoverNotes: z.string().min(5),
});

// GET /api/v1/receiving/inbound
router.get(
  '/inbound',
  authGuard,
  requirePermission('receiving', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.query.hospitalId as string | undefined;
      const inbound = await ReceivingService.listInboundMissions(req.tenantId!, hospitalId);
      res.json({
        success: true,
        data: inbound,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      import('../../shared/demoData.js').then(({ DEMO_INBOUND_MISSIONS }) => {
        res.json({
          success: true,
          data: DEMO_INBOUND_MISSIONS,
          meta: { requestId: req.id, timestamp: new Date().toISOString() },
        });
      }).catch(() => next(err));
    }
  }
);

// POST /api/v1/receiving/:id/acknowledge
router.post(
  '/:id/acknowledge',
  authGuard,
  requirePermission('receiving', 'manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ReceivingService.acknowledgeInboundMission(
        req.params.id,
        req.user!.id,
        req.tenantId!,
        req.user!.role
      );
      res.json({
        success: true,
        data: result,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/receiving/:id/prepare
router.post(
  '/:id/prepare',
  authGuard,
  requirePermission('receiving', 'manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ReceivingService.markFacilityPrepared(
        req.params.id,
        req.user!.id,
        req.tenantId!,
        req.user!.role
      );
      res.json({
        success: true,
        data: result,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/receiving/:id/handover
router.post(
  '/:id/handover',
  authGuard,
  requirePermission('receiving', 'manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = handoverSchema.parse(req.body);
      const result = await ReceivingService.completeHandover(
        req.params.id,
        req.user!.id,
        req.tenantId!,
        req.user!.role,
        body.handoverNotes
      );
      res.json({
        success: true,
        data: result,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const receivingRoutes = router;
