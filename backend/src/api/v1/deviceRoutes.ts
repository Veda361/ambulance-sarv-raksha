import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DeviceService } from '../../modules/device/deviceService.js';
import { LocationService } from '../../modules/location/locationService.js';
import { authGuard } from '../../middleware/authGuard.js';
import { requirePermission } from '../../middleware/rbacGuard.js';

const router = Router();

const registerDeviceSchema = z.object({
  ambulanceId: z.string().uuid().optional(),
  deviceIdentifier: z.string().min(3),
  deviceType: z.enum(['OBD2_TRACKER', 'ESP32_GATEWAY', 'STM32_MONITOR_BRIDGE', 'ANDROID_DEVICE']),
});

const deviceTelemetrySchema = z.object({
  deviceIdentifier: z.string(),
  apiKey: z.string(),
  missionId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedMps: z.number().min(0).optional(),
  bearingDeg: z.number().min(0).max(360).optional(),
  sequenceNumber: z.number().int().min(1),
  recordedAt: z.string().datetime(),
});

// POST /api/v1/devices (Register device)
router.post(
  '/',
  authGuard,
  requirePermission('device', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = registerDeviceSchema.parse(req.body);
      const result = await DeviceService.registerDevice(
        { ...body, tenantId: req.tenantId! },
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

// POST /api/v1/devices/telemetry (Direct device push authenticated via API Key)
router.post('/telemetry', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = deviceTelemetrySchema.parse(req.body);
    const device = await DeviceService.authenticateDevice(body.deviceIdentifier, body.apiKey);

    if (!device.ambulance_id) {
      res.status(400).json({ success: false, error: { message: 'Device is not paired with an active ambulance' } });
      return;
    }

    const result = await LocationService.recordLocation({
      missionId: body.missionId,
      ambulanceId: device.ambulance_id,
      tenantId: device.tenant_id,
      latitude: body.latitude,
      longitude: body.longitude,
      speedMps: body.speedMps,
      bearingDeg: body.bearingDeg,
      sequenceNumber: body.sequenceNumber,
      recordedAt: body.recordedAt,
    });

    res.status(result.deduplicated ? 200 : 201).json({
      success: true,
      data: result,
      meta: { requestId: req.id, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

export const deviceRoutes = router;
