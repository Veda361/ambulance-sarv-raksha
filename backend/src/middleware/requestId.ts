import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id: string;
      tenantId?: string;
      user?: {
        id: string;
        tenantId: string;
        role: import('../modules/authorization/permissions.js').UserRole;
        email: string;
        name: string;
      };
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'];
  const id = (Array.isArray(existingId) ? existingId[0] : existingId) || crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
}
