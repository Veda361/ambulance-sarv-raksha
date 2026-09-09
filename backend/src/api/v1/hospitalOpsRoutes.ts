import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { HospitalOpsService } from '../../modules/organization/hospitalOpsService.js';
import { authGuard } from '../../middleware/authGuard.js';
import { requirePermission } from '../../middleware/rbacGuard.js';

const router = Router();

const updateDiversionSchema = z.object({
  diversionStatus: z.enum(['NORMAL', 'ADVISORY', 'DIVERT_ALL', 'TRAUMA_BYPASS']),
});

// GET /api/v1/hospital-ops/dashboard
router.get(
  '/dashboard',
  authGuard,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.query.hospitalId as string | undefined;
      const kpis = await HospitalOpsService.getDashboardKPIs(req.tenantId!, hospitalId);
      res.json({
        success: true,
        data: kpis,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/hospital-ops/hospitals/:id
router.get(
  '/hospitals/:id',
  authGuard,
  requirePermission('hospital', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospital = await HospitalOpsService.getHospitalById(req.params.id, req.tenantId!);
      res.json({
        success: true,
        data: hospital,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/hospital-ops/hospitals/:id/status
router.patch(
  '/hospitals/:id/status',
  authGuard,
  requirePermission('hospital', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = updateDiversionSchema.parse(req.body);
      const hospital = await HospitalOpsService.updateDiversionStatus(
        req.params.id,
        req.tenantId!,
        body.diversionStatus,
        req.user?.id
      );
      res.json({
        success: true,
        data: hospital,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const hospitalOpsRoutes = router;
