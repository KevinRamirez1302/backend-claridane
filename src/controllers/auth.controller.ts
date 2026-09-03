import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiry,
} from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/authenticate';

const isProduction = env.NODE_ENV === 'production';

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });
}

// POST /api/auth/admin/login
export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    });
    const { username, password } = schema.parse(req.body);

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      sendError(res, 401, 'INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos');
      return;
    }

    const payload = { id: admin.id, rol: 'admin' as const };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: { token: refreshToken, adminId: admin.id, expira: refreshTokenExpiry() },
    });

    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { accessToken, user: { id: admin.id, username: admin.username, rol: 'admin' } });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/socio-login
export async function socioLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      dni: z.string().min(1),
      password: z.string().min(1),
    });
    const { dni, password } = schema.parse(req.body);

    const socio = await prisma.socio.findUnique({ where: { dni } });
    if (!socio || !(await bcrypt.compare(password, socio.passwordHash))) {
      sendError(res, 401, 'INVALID_CREDENTIALS', 'DNI o contraseña incorrectos');
      return;
    }
    if (!socio.activo || socio.eliminado) {
      sendError(res, 403, 'ACCOUNT_DISABLED', 'Tu cuenta está desactivada. Contacta con el club.');
      return;
    }

    const payload = { id: socio.id, rol: 'socio' as const };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: { token: refreshToken, socioId: socio.id, expira: refreshTokenExpiry() },
    });

    setRefreshCookie(res, refreshToken);
    const socioData = { id: socio.id, email: socio.email, nombre: socio.nombre, dni: socio.dni, plan: socio.plan };
    sendSuccess(res, {
      // Formato unificado: accessToken + user (compatible con useAuthStore)
      accessToken,
      user: { id: socio.id, email: socio.email, nombre: socio.nombre, rol: 'socio' as const },
      // Retrocompatibilidad con useMembershipStore.loginSocio
      token: accessToken,
      socio: socioData,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token: string | undefined = req.cookies?.refreshToken;
    if (!token) {
      sendError(res, 401, 'NO_REFRESH_TOKEN', 'Refresh token no proporcionado');
      return;
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expira < new Date()) {
      sendError(res, 401, 'INVALID_REFRESH_TOKEN', 'Refresh token inválido o expirado');
      return;
    }

    const payload = verifyRefreshToken(token);
    const accessToken = signAccessToken({ id: payload.id, rol: payload.rol });

    sendSuccess(res, { accessToken });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token: string | undefined = req.cookies?.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }
    res.clearCookie('refreshToken');
    sendSuccess(res, { message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'No autenticado');
      return;
    }

    if (req.user.rol === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { id: req.user.id },
        select: { id: true, username: true, creadoEn: true },
      });
      sendSuccess(res, { ...admin, rol: 'admin' });
    } else {
      const socio = await prisma.socio.findUnique({
        where: { id: req.user.id },
        select: { id: true, nombre: true, apellidos: true, email: true, plan: true, numSocio: true, activo: true },
      });
      sendSuccess(res, { ...socio, rol: 'socio' });
    }
  } catch (err) {
    next(err);
  }
}
