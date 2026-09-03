import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { sendSuccess, sendPaginated, sendError } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { AuthRequest } from '../middleware/authenticate';

const registroSchema = z.object({
  nombre: z.string().min(1),
  apellidos: z.string().min(1),
  email: z.string().email(),
  dni: z.string().min(1, 'El DNI es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  planId: z.enum(['socio', 'socio_premium']),
  telefono: z.string().optional(),
  dni: z.string().min(1, 'El DNI es obligatorio'),
});

export function generarNumSocio(id: number): string {
  return `ARI-${String(id).padStart(5, '0')}`;
}

// POST /api/socios/registro
export async function registroSocio(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registroSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 12);

    const socio = await prisma.socio.create({
      data: {
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        dni: data.dni,
        passwordHash,
        plan: data.planId,
        telefono: data.telefono,
        numSocio: `ARI-TEMP-${Date.now()}`, // temporal hasta tener el id real
      },
    });

    // Actualizar con el número de socio definitivo basado en el id
    const socioActualizado = await prisma.socio.update({
      where: { id: socio.id },
      data: { numSocio: generarNumSocio(socio.id) },
      select: { id: true, nombre: true, apellidos: true, email: true, dni: true, plan: true, numSocio: true },
    });

    sendSuccess(res, socioActualizado, 201);
  } catch (err) {
    next(err);
  }
}

// GET /api/socios/me
export async function getMiPerfil(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const socio = await prisma.socio.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, nombre: true, apellidos: true, email: true,
        dni: true, telefono: true, plan: true, numSocio: true,
        activo: true, creadoEn: true, renovadoEn: true,
      },
    });
    if (!socio) { sendError(res, 404, 'NOT_FOUND', 'Socio no encontrado'); return; }
    sendSuccess(res, socio);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/socios/me
export async function updateMiPerfil(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      nombre: z.string().optional(),
      apellidos: z.string().optional(),
      telefono: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const socio = await prisma.socio.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, nombre: true, apellidos: true, email: true, dni: true, telefono: true, plan: true, numSocio: true },
    });
    sendSuccess(res, socio);
  } catch (err) {
    next(err);
  }
}

// POST /api/socios/me/cambiar-password
export async function cambiarPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      passwordActual: z.string().min(1),
      passwordNueva: z.string().min(6),
    });
    const { passwordActual, passwordNueva } = schema.parse(req.body);

    const socio = await prisma.socio.findUnique({ where: { id: req.user!.id } });
    if (!socio) { sendError(res, 404, 'NOT_FOUND', 'Socio no encontrado'); return; }

    const valido = await bcrypt.compare(passwordActual, socio.passwordHash);
    if (!valido) { sendError(res, 401, 'INVALID_PASSWORD', 'La contraseña actual no es correcta'); return; }

    await prisma.socio.update({
      where: { id: socio.id },
      data: { passwordHash: await bcrypt.hash(passwordNueva, 12) },
    });

    sendSuccess(res, { message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}

// GET /api/socios — Admin only
export async function listSocios(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const { activo, plan } = req.query as { activo?: string; plan?: string };

    const where = {
      eliminado: false,
      ...(activo !== undefined ? { activo: activo === 'true' } : {}),
      ...(plan ? { plan: plan as 'socio' | 'socio_premium' } : {}),
    };

    const [socios, total] = await Promise.all([
      prisma.socio.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip,
        take: limit,
        select: { id: true, nombre: true, apellidos: true, email: true, dni: true, plan: true, numSocio: true, activo: true, creadoEn: true },
      }),
      prisma.socio.count({ where }),
    ]);

    sendPaginated(res, socios, { page, limit, total });
  } catch (err) {
    next(err);
  }
}

// GET /api/socios/:id — Admin only
export async function getSocio(req: Request, res: Response, next: NextFunction) {
  try {
    const socio = await prisma.socio.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, nombre: true, apellidos: true, email: true, dni: true, telefono: true, plan: true, numSocio: true, activo: true, creadoEn: true, renovadoEn: true },
    });
    if (!socio) { sendError(res, 404, 'NOT_FOUND', 'Socio no encontrado'); return; }
    sendSuccess(res, socio);
  } catch (err) {
    next(err);
  }
}

// PUT /api/socios/:id — Admin only (actualización completa de perfil)
export async function updateSocioAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      nombre: z.string().min(1).optional(),
      apellidos: z.string().min(1).optional(),
      email: z.string().email().optional(),
      dni: z.string().min(1).optional(),
      telefono: z.string().nullable().optional(),
      plan: z.enum(['socio', 'socio_premium']).optional(),
      activo: z.boolean().optional(),
    });
    const data = schema.parse(req.body);

    const socio = await prisma.socio.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, nombre: true, apellidos: true, email: true, dni: true, telefono: true, plan: true, numSocio: true, activo: true, creadoEn: true, renovadoEn: true },
    });
    sendSuccess(res, socio);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/socios/:id/estado — Admin only
export async function toggleEstadoSocio(req: Request, res: Response, next: NextFunction) {
  try {
    const { activo } = z.object({ activo: z.boolean() }).parse(req.body);
    const socio = await prisma.socio.update({
      where: { id: Number(req.params.id) },
      data: { activo },
      select: { id: true, nombre: true, activo: true },
    });
    sendSuccess(res, socio);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/socios/:id — Admin only (soft delete)
export async function deleteSocio(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.socio.update({
      where: { id: Number(req.params.id) },
      data: { eliminado: true, activo: false },
    });
    sendSuccess(res, { message: 'Socio dado de baja correctamente' });
  } catch (err) {
    next(err);
  }
}
