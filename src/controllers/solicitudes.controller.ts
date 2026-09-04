import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';
import { generarNumSocio } from './socios.controller';

export async function getAllSolicitudes(req: Request, res: Response, next: NextFunction) {
  try {
    const { estado } = req.query as { estado?: 'pendiente' | 'aceptada' | 'rechazada' };
    const solicitudes = await prisma.solicitud.findMany({
      where: estado ? { estado } : undefined,
      orderBy: { fechaSolicitud: 'desc' },
    });
    sendSuccess(res, solicitudes);
  } catch (err) {
    next(err);
  }
}

const solicitudSchema = z.object({
  nombre:          z.string().min(1, 'El nombre es requerido'),
  apellidos:       z.string().min(1, 'Los apellidos son requeridos'),
  email:           z.string().email('Email inválido'),
  dni:             z.string().min(1, 'El DNI es requerido'),
  fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  plan:            z.enum(['socio', 'socio_premium'], { errorMap: () => ({ message: 'Plan inválido' }) }),
  telefono:        z.string().optional(),
});

export async function createSolicitud(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Validar campos requeridos antes de tocar la BD
    const parsed = solicitudSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, 'VALIDATION_ERROR', parsed.error.errors.map(e => e.message).join(', '));
      return;
    }
    const { nombre, apellidos, email, telefono, dni, fechaNacimiento, plan } = parsed.data;

    // 2. Verificar si ya existe una solicitud pendiente con ese DNI
    const existing = await prisma.solicitud.findFirst({ where: { dni, estado: 'pendiente' } });
    if (existing) {
      sendError(res, 400, 'ALREADY_EXISTS', 'Ya existe una solicitud pendiente con ese DNI. El club revisará tu solicitud próximamente.');
      return;
    }

    // 3. Verificar que no existe ya como socio activo
    //    Envuelto en try/catch por si la migración aún no se aplicó en producción
    //    (columna Socio.dni puede no existir todavía)
    try {
      const socioExistente = await prisma.socio.findFirst({ where: { dni } });
      if (socioExistente && !socioExistente.eliminado) {
        sendError(res, 400, 'ALREADY_MEMBER', 'Ya existe un socio registrado con ese DNI. Si tienes problemas para acceder, contacta con el club.');
        return;
      }
    } catch {
      // Si falla (columna dni no existe aún en BD), continuamos sin bloquear la solicitud
      console.warn('⚠️  No se pudo verificar Socio.dni — ¿migración pendiente en producción?');
    }

    // 4. Crear la solicitud
    const nuevaSolicitud = await prisma.solicitud.create({
      data: { nombre, apellidos, email, telefono, dni, fechaNacimiento, plan, estado: 'pendiente' },
    });

    sendSuccess(res, nuevaSolicitud, 201);
  } catch (err) {
    next(err);
  }
}

export async function acceptSolicitud(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const solicitud = await prisma.solicitud.findUnique({ where: { id: Number(id) } });

    if (!solicitud || solicitud.estado !== 'pendiente') {
      sendError(res, 400, 'INVALID_REQUEST', 'Solicitud no encontrada o ya procesada.');
      return;
    }

    const defaultPassword = '123456';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Todo dentro de una transacción para garantizar consistencia
    const [updatedSolicitud, socioFinal] = await prisma.$transaction(async (tx) => {
      // Crear socio con numSocio temporal
      const nuevoSocio = await tx.socio.create({
        data: {
          nombre: solicitud.nombre,
          apellidos: solicitud.apellidos,
          email: solicitud.email,
          dni: solicitud.dni,
          passwordHash,
          telefono: solicitud.telefono ?? null,
          plan: solicitud.plan,
          numSocio: `ARD-TEMP-${Date.now()}`,
        },
      });

      // Actualizar solicitud a aceptada y asignar numSocio definitivo en paralelo
      const [sol, socio] = await Promise.all([
        tx.solicitud.update({
          where: { id: Number(id) },
          data: { estado: 'aceptada' },
        }),
        tx.socio.update({
          where: { id: nuevoSocio.id },
          data: { numSocio: generarNumSocio(nuevoSocio.id) },
        }),
      ]);

      return [sol, socio];
    });

    // No devolver passwordHash ni la contraseña en plano en la respuesta
    const { passwordHash: _omit, ...socioPublico } = socioFinal as typeof socioFinal & { passwordHash: string };

    sendSuccess(res, { solicitud: updatedSolicitud, socio: socioPublico });
  } catch (err) {
    next(err);
  }
}

export async function rejectSolicitud(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const solicitud = await prisma.solicitud.update({
      where: { id: Number(id) },
      data: { estado: 'rechazada' },
    });

    sendSuccess(res, solicitud);
  } catch (err) {
    next(err);
  }
}
