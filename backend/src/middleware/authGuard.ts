import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthenticationError } from '../shared/errors.js';
import { UserRole } from '../modules/authorization/permissions.js';

export function authGuard(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Bearer authorization token is required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as {
      sub: string;
      tenantId: string;
      role: UserRole;
      email: string;
      name: string;
    };

    req.user = {
      id: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
    req.tenantId = payload.tenantId;

    next();
  } catch (err) {
    return next(new AuthenticationError('Invalid or expired authentication token'));
  }
}
