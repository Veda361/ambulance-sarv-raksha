import { Request, Response, NextFunction } from 'express';
import { hasPermission, Resource, Action } from '../modules/authorization/permissions.js';
import { AuthorizationError, AuthenticationError } from '../shared/errors.js';

export function requirePermission(resource: Resource, action: Action) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Zero-PHI guard for Super Admin
    if (req.user.role === 'SUPER_ADMIN' && (resource === 'patient' || resource === 'vital')) {
      return next(new AuthorizationError('Super Admins are structurally forbidden from accessing clinical PHI'));
    }

    const allowed = hasPermission(req.user.role, resource, action);
    if (!allowed) {
      return next(
        new AuthorizationError(
          `Role '${req.user.role}' is not authorized to perform action '${action}' on resource '${resource}'`
        )
      );
    }

    next();
  };
}
