import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { IdentityService } from '../../modules/identity/identityService.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  deviceId: z.string().optional(),
});

const registerSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([
    'SUPER_ADMIN',
    'ORGANIZATION_ADMIN',
    'HOSPITAL_ADMIN',
    'DISPATCHER',
    'DRIVER',
    'EMT',
    'RECEIVING_HOSPITAL_USER',
    'GOVERNMENT_OPERATOR',
  ]),
  phone: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);
    const clientIp = req.ip || req.socket.remoteAddress;
    const result = await IdentityService.login(body.email, body.password, body.deviceId, clientIp);
    res.json({
      success: true,
      data: result,
      meta: { requestId: req.id, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/register (Internal/Admin provisioning)
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerSchema.parse(req.body);
    const user = await IdentityService.createUser(body);
    res.status(201).json({
      success: true,
      data: user,
      meta: { requestId: req.id, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = refreshSchema.parse(req.body);
    const result = await IdentityService.refreshAccessToken(body.refreshToken);
    res.json({
      success: true,
      data: result,
      meta: { requestId: req.id, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = refreshSchema.parse(req.body);
    await IdentityService.logout(body.refreshToken);
    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      meta: { requestId: req.id, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await IdentityService.getUserById(req.user!.id);
    res.json({
      success: true,
      data: user,
      meta: { requestId: req.id, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

export const authRoutes = router;
