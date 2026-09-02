import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export async function getAllSolicitudes(req: Request, res: Response, next: NextFunction) {
  try {
    const solicitudes = await prisma.solicitud.findMany({
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
    const existing = await prisma.solicitud.findUnique({ where: { dni } });
    if (existing && existing.estado === 'pendiente') {
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
    const numSocio = `ARD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;

    const [updatedSolicitud, nuevoSocio] = await prisma.$transaction([
      prisma.solicitud.update({
        where: { id: Number(id) },
        data: { estado: 'aceptada' }
      }),
      prisma.socio.create({
        data: {
          nombre: `${solicitud.nombre} ${solicitud.apellidos}`,
          apellidos: '', // Concatenated in nombre for simplicity based on original spec
          email: solicitud.email,
          dni: solicitud.dni,
          passwordHash,
          telefono: solicitud.telefono,
          plan: solicitud.plan,
          numSocio,
        }
      })
    ]);

    // Format password to send it back so the admin can copy it
    const socioData = {
      ...nuevoSocio,
      password: defaultPassword
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
