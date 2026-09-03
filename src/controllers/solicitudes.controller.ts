import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

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


export async function createSolicitud(req: Request, res: Response, next: NextFunction) {
  try {
    const { nombre, apellidos, email, telefono, dni, fechaNacimiento, plan } = req.body;
    
    // Check if DNI already has an active request or is a member
    const existing = await prisma.solicitud.findFirst({ where: { dni, estado: 'pendiente' } });
    if (existing) {
      sendError(res, 400, 'ALREADY_EXISTS', 'Ya tienes una solicitud pendiente.');
      return;
    }

    const nuevaSolicitud = await prisma.solicitud.create({
      data: {
        nombre,
        apellidos,
        email,
        telefono,
        dni,
        fechaNacimiento,
        plan,
        estado: 'pendiente'
      }
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

    // Crear socio con numSocio temporal, luego actualizar con id real (sin colisiones)
    const nuevoSocio = await prisma.socio.create({
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

    const [updatedSolicitud, socioFinal] = await prisma.$transaction([
      prisma.solicitud.update({
        where: { id: Number(id) },
        data: { estado: 'aceptada' },
      }),
      prisma.socio.update({
        where: { id: nuevoSocio.id },
        data: { numSocio: `ARD-${new Date().getFullYear()}-${String(nuevoSocio.id).padStart(4, '0')}` },
      }),
    ]);

    const socioData = {
      ...socioFinal,
      password: defaultPassword,
    };

    sendSuccess(res, { solicitud: updatedSolicitud, socio: socioData });
  } catch (err) {
    next(err);
  }
}


export async function rejectSolicitud(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    
    const solicitud = await prisma.solicitud.update({
      where: { id: Number(id) },
      data: { estado: 'rechazada' }
    });

    sendSuccess(res, solicitud);
  } catch (err) {
    next(err);
  }
}
