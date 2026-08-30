import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { sendError } from '../utils/response';

export function requireRole(...roles: Array<'admin' | 'socio'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'No autenticado');
      return;
    }
    if (!roles.includes(req.user.rol)) {
      sendError(res, 403, 'FORBIDDEN', 'No tienes permiso para realizar esta acción');
      return;
    }
    next();
  };
}
