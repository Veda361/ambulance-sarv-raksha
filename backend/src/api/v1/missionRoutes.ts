import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { MissionService } from '../../modules/mission/missionService.js';
import { PatientService } from '../../modules/patient/patientService.js';
import { LocationService } from '../../modules/location/locationService.js';
import { ClinicalService } from '../../modules/clinical/clinicalService.js';
import { authGuard } from '../../middleware/authGuard.js';
import { requirePermission } from '../../middleware/rbacGuard.js';

const router = Router();

const createPatientSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().min(0).max(130).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']).optional(),
  emergencyContact: z.string().optional(),
  chiefComplaint: z.string().optional(),
});

const createMissionSchema = z.object({
  patientId: z.string().uuid().optional(),
  ambulanceId: z.string().uuid(),
  driverId: z.string().uuid(),
  destinationHospitalId: z.string().uuid(),
  triageAcuity: z.enum(['RED_CRITICAL', 'YELLOW_URGENT', 'GREEN_NON_URGENT', 'BLACK_EXPECTANT']).optional(),
  pickupLatitude: z.number().min(-90).max(90),
  pickupLongitude: z.number().min(-180).max(180),
  pickupAddress: z.string().min(3),
});

const transitionSchema = z.object({
  targetState: z.enum([
    'REQUESTED',
    'DISPATCHING',
    'ASSIGNED',
    'ACCEPTED',
    'EN_ROUTE_TO_PICKUP',
    'ARRIVED_PICKUP',
    'PATIENT_ONBOARD',
    'EN_ROUTE_TO_HOSPITAL',
    'ARRIVED_HOSPITAL',
    'HANDOVER',
    'COMPLETED',
    'CANCELLED',
    'REJECTED',
  ]),
  metadata: z.record(z.any()).optional(),
});

const locationSchema = z.object({
  ambulanceId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedMps: z.number().min(0).optional(),
  bearingDeg: z.number().min(0).max(360).optional(),
  accuracyMeters: z.number().min(0).optional(),
  sequenceNumber: z.number().int().min(1),
  recordedAt: z.string().datetime(),
});

const vitalsSchema = z.object({
  patientId: z.string().uuid(),
  heartRate: z.number().int().min(0).max(300).optional(),
  spo2Percent: z.number().int().min(0).max(100).optional(),
  systolicBp: z.number().int().min(0).max(300).optional(),
  diastolicBp: z.number().int().min(0).max(200).optional(),
  respiratoryRate: z.number().int().min(0).max(100).optional(),
  temperatureC: z.number().min(25).max(45).optional(),
  recordedAt: z.string().datetime(),
});

// POST /api/v1/missions/patient
router.post(
  '/patient',
  authGuard,
  requirePermission('patient', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createPatientSchema.parse(req.body);
      const patient = await PatientService.createPatient(
        { ...body, tenantId: req.tenantId! },
        req.user?.id
      );
      res.status(201).json({
        success: true,
        data: patient,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/missions
router.post(
  '/',
  authGuard,
  requirePermission('mission', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createMissionSchema.parse(req.body);
      const mission = await MissionService.createMission(
        { ...body, tenantId: req.tenantId! },
        req.user!.id,
        req.user!.role
      );
      res.status(201).json({
        success: true,
        data: mission,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/missions
router.get(
  '/',
  authGuard,
  requirePermission('mission', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt((req.query.limit as string) || '20', 10);
      const offset = parseInt((req.query.offset as string) || '0', 10);
      const missions = await MissionService.listMissions(req.tenantId!, limit, offset);
      res.json({
        success: true,
        data: missions,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/missions/:id
router.get(
  '/:id',
  authGuard,
  requirePermission('mission', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mission = await MissionService.getMissionById(
        req.params.id,
        req.tenantId!,
        req.user!.role
      );
      res.json({
        success: true,
        data: mission,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/missions/:id/transition
router.post(
  '/:id/transition',
  authGuard,
  requirePermission('mission', 'transition'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = transitionSchema.parse(req.body);
      const mission = await MissionService.transitionState(
        req.params.id,
        body.targetState,
        req.user!.id,
        req.user!.role,
        req.tenantId!,
        body.metadata
      );
      res.json({
        success: true,
        data: mission,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/missions/:id/location
router.post(
  '/:id/location',
  authGuard,
  requirePermission('location', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = locationSchema.parse(req.body);
      const result = await LocationService.recordLocation({
        ...body,
        missionId: req.params.id,
        tenantId: req.tenantId!,
      });
      res.status(result.deduplicated ? 200 : 201).json({
        success: true,
        data: result,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/missions/:id/vitals
router.post(
  '/:id/vitals',
  authGuard,
  requirePermission('vital', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = vitalsSchema.parse(req.body);
      const result = await ClinicalService.recordVitals(
        {
          ...body,
          missionId: req.params.id,
          tenantId: req.tenantId!,
        },
        req.user?.id
      );
      res.status(201).json({
        success: true,
        data: result,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const missionRoutes = router;
