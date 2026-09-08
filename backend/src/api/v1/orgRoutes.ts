import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrganizationService } from '../../modules/organization/organizationService.js';
import { authGuard } from '../../middleware/authGuard.js';
import { requirePermission } from '../../middleware/rbacGuard.js';

const router = Router();

const createOrgSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(50),
  type: z.enum([
    'PRIVATE_HOSPITAL',
    'HOSPITAL_NETWORK',
    'AMBULANCE_OPERATOR',
    'GOVERNMENT_EMS',
    'INDEPENDENT_FLEET',
  ]),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
});

const createHospitalSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(50),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(5),
  traumaLevel: z.enum(['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'COMMUNITY']).optional(),
  contactPhone: z.string().min(5),
});

// POST /api/v1/organizations (Super Admin or initial setup)
router.post(
  '/',
  authGuard,
  requirePermission('organization', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createOrgSchema.parse(req.body);
      const org = await OrganizationService.createOrganization(body, req.user?.id);
      res.status(201).json({
        success: true,
        data: org,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/organizations
router.get(
  '/',
  authGuard,
  requirePermission('organization', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgs = await OrganizationService.listOrganizations();
      res.json({
        success: true,
        data: orgs,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/organizations/:id
router.get(
  '/:id',
  authGuard,
  requirePermission('organization', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const org = await OrganizationService.getOrganizationById(req.params.id);
      res.json({
        success: true,
        data: org,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/organizations/:id/hospitals
router.post(
  '/:id/hospitals',
  authGuard,
  requirePermission('hospital', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createHospitalSchema.parse(req.body);
      const hospital = await OrganizationService.createHospital(
        { ...body, tenantId: req.params.id },
        req.user?.id
      );
      res.status(201).json({
        success: true,
        data: hospital,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/organizations/:id/hospitals
router.get(
  '/:id/hospitals',
  authGuard,
  requirePermission('hospital', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitals = await OrganizationService.listHospitalsByTenant(req.params.id);
      res.json({
        success: true,
        data: hospitals,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const orgRoutes = router;
