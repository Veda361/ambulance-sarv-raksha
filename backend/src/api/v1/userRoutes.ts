import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../../database/index.js';
import { IdentityService } from '../../modules/identity/identityService.js';
import { authGuard } from '../../middleware/authGuard.js';
import { requirePermission } from '../../middleware/rbacGuard.js';

const router = Router();

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([
    'HOSPITAL_ADMIN',
    'DISPATCHER',
    'DRIVER',
    'EMT',
    'RECEIVING_HOSPITAL_USER',
  ]),
  phone: z.string().optional(),
  hospitalId: z.string().uuid().optional(),
});

// GET /api/v1/users
router.get(
  '/',
  authGuard,
  requirePermission('user', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.query.role as string | undefined;
      const hospitalId = req.query.hospitalId as string | undefined;

      let sql = `
        SELECT u.id, u.tenant_id, u.name, u.email, u.role, u.phone, u.hospital_id,
               u.is_active, u.created_at, h.name as hospital_name
        FROM users u
        LEFT JOIN hospitals h ON h.id = u.hospital_id
        WHERE u.tenant_id = $1
      `;
      const params: any[] = [req.tenantId];

      if (role) {
        params.push(role);
        sql += ` AND u.role = $${params.length}`;
      }

      if (hospitalId) {
        params.push(hospitalId);
        sql += ` AND u.hospital_id = $${params.length}`;
      }

      sql += ` ORDER BY u.created_at DESC`;

      const usersRes = await query(sql, params);

      res.json({
        success: true,
        data: usersRes.rows,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/users
router.post(
  '/',
  authGuard,
  requirePermission('user', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createUserSchema.parse(req.body);
      const user = await IdentityService.createUser(
        {
          tenantId: req.tenantId!,
          name: body.name,
          email: body.email,
          password: body.password,
          role: body.role as any,
          phone: body.phone,
        },
        req.user?.id
      );

      // If hospitalId provided, link user to hospital
      if (body.hospitalId) {
        await query('UPDATE users SET hospital_id = $1 WHERE id = $2', [body.hospitalId, user.id]);
        user.hospital_id = body.hospitalId;
      }

      res.status(201).json({
        success: true,
        data: user,
        meta: { requestId: req.id, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

export const userRoutes = router;
