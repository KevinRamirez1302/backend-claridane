import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { cloudinary } from '../config/cloudinary';
import { uploadToCloudinary } from '../middleware/upload';
import { sendSuccess, sendPaginated, sendError } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';

const jugadorSchema = z.object({
  nombre: z.string().min(1),
  clasificaciones: z.array(z.string()),
  equipos: z.array(z.string()),
  foto: z.string().optional(),
  nacionalidad: z.string().min(1),
  edad: z.number().int().nullable().optional(),
  peso: z.number().nullable().optional(),
  altura: z.number().nullable().optional(),
  luchadas: z.number().int().nullable().optional(),
  puntosFavor: z.number().int().nullable().optional(),
  puntosContra: z.number().int().nullable().optional(),
  bio: z.string().nullable().optional(),
});

// GET /api/plantilla
export async function listPlantilla(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const { equipo, clasificacion } = req.query as { equipo?: string; clasificacion?: string };

    const where = {
      ...(equipo ? { equipos: { has: equipo } } : {}),
      ...(clasificacion ? { clasificaciones: { has: clasificacion } } : {}),
    };

    const [jugadores, total] = await Promise.all([
      prisma.jugador.findMany({ where, orderBy: { nombre: 'asc' }, skip, take: limit }),
      prisma.jugador.count({ where }),
    ]);

    sendPaginated(res, jugadores, { page, limit, total });
  } catch (err) {
    next(err);
  }
}

// GET /api/plantilla/:id
export async function getJugador(req: Request, res: Response, next: NextFunction) {
  try {
    const jugador = await prisma.jugador.findUnique({ where: { id: Number(req.params.id) } });
    if (!jugador) { sendError(res, 404, 'NOT_FOUND', 'Jugador no encontrado'); return; }
    sendSuccess(res, jugador);
  } catch (err) {
    next(err);
  }
}

// POST /api/plantilla
export async function createJugador(req: Request, res: Response, next: NextFunction) {
  try {
    const data = jugadorSchema.parse(req.body);
    const jugador = await prisma.jugador.create({ data: { ...data, foto: data.foto ?? '' } });
    sendSuccess(res, jugador, 201);
  } catch (err) {
    next(err);
  }
}

// PUT /api/plantilla/:id
export async function updateJugador(req: Request, res: Response, next: NextFunction) {
  try {
    const data = jugadorSchema.parse(req.body);
    const jugador = await prisma.jugador.update({
      where: { id: Number(req.params.id) },
      data: { ...data, foto: data.foto ?? '' },
    });
    sendSuccess(res, jugador);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/plantilla/:id
export async function deleteJugador(req: Request, res: Response, next: NextFunction) {
  try {
    const jugador = await prisma.jugador.findUnique({ where: { id: Number(req.params.id) } });
    if (!jugador) { sendError(res, 404, 'NOT_FOUND', 'Jugador no encontrado'); return; }

    if (jugador.fotoPublicId) {
      await cloudinary.uploader.destroy(jugador.fotoPublicId);
    }

    await prisma.jugador.delete({ where: { id: jugador.id } });
    sendSuccess(res, { message: 'Jugador eliminado correctamente' });
  } catch (err) {
    next(err);
  }
}

// POST /api/plantilla/:id/foto
export async function uploadFotoJugador(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { sendError(res, 400, 'NO_FILE', 'No se ha proporcionado ninguna foto'); return; }
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'plantilla');
    const jugador = await prisma.jugador.update({
      where: { id: Number(req.params.id) },
      data: { foto: url, fotoPublicId: publicId },
    });
    sendSuccess(res, { url: jugador.foto });
  } catch (err) {
    next(err);
  }
}
