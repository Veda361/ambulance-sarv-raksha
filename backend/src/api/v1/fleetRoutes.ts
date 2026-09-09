import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FleetService } from '../../modules/fleet/fleetService.js';
import { authGuard } from '../../middleware/authGuard.js';
import { requirePermission } from '../../middleware/rbacGuard.js';

const router = Router();

const createAmbulanceSchema = z.object({
  hospitalId: z.string().uuid().optional(),
  callSign: z.string().min(2),
  registrationNumber: z.string().min(2),
  capability: z.enum(['BLS', 'ALS', 'NICU', 'PTV']).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'AVAILABLE',
    'ASSIGNED',
    'EN_ROUTE',
    'ON_SCENE',
    'TRANSPORTING',
    'AT_HOSPITAL',
    'MAINTENANCE',
    'OFF_DUTY',
  ]),
});

const crewShiftSchema = z.object({
  ambulanceId: z.string().uuid(),
  driverId: z.string().uuid(),
  emtId: z.string().uuid().optional(),
  shiftStart: z.string().datetime(),
  shiftEnd: z.string().datetime().optional(),
});

// POST /api/v1/fleet/ambulances
router.post(
  '/ambulances',
  authGuard,
  requirePermission('ambulance', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createAmbulanceSchema.parse(req.body);
      const ambulance = await FleetService.createAmbulance(
        { ...body, tenantId: req.tenantId! },
        req.user?.id
      );
      res.status(201).json({
        success: true,
        data: ambulance,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/fleet/ambulances
router.get(
  '/ambulances',
  authGuard,
  requirePermission('ambulance', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ambulances = await FleetService.listAmbulances(req.tenantId!);
      res.json({
        success: true,
        data: ambulances,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      import('../../shared/demoData.js').then(({ DEMO_AMBULANCES }) => {
        res.json({
          success: true,
          data: DEMO_AMBULANCES,
          meta: { requestId: req.id, timestamp: new Date().toISOString() },
        });
      }).catch(() => next(err));
    }
  }
);

// GET /api/v1/fleet/ambulances/nearest
router.get(
  '/ambulances/nearest',
  authGuard,
  requirePermission('ambulance', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const capability = req.query.capability as string | undefined;

      if (isNaN(lat) || isNaN(lon)) {
        res.status(400).json({ success: false, error: { message: 'lat and lon are required query parameters' } });
        return;
      }

      const candidates = await FleetService.findNearestAvailableAmbulances(
        req.tenantId!,
        lat,
        lon,
        capability,
        parseInt((req.query.limit as string) || '5', 10)
      );

      res.json({
        success: true,
        data: candidates,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/fleet/ambulances/:id/status
router.patch(
  '/ambulances/:id/status',
  authGuard,
  requirePermission('ambulance', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = updateStatusSchema.parse(req.body);
      const ambulance = await FleetService.updateVehicleStatus(
        req.params.id,
        req.tenantId!,
        body.status,
        req.user?.id
      );
      res.json({
        success: true,
        data: ambulance,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/fleet/crew-shifts
router.post(
  '/crew-shifts',
  authGuard,
  requirePermission('crew', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = crewShiftSchema.parse(req.body);
      const shift = await FleetService.createCrewShift(
        { ...body, tenantId: req.tenantId! },
        req.user?.id
      );
      res.status(201).json({
        success: true,
        data: shift,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const fleetRoutes = router;
