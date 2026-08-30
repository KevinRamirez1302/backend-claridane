import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

const posicionSchema = z.object({
  posicion: z.number().int().min(1),
  equipo: z.string().min(1),
  luchadas: z.number().int().min(0),
  ganadas: z.number().int().min(0),
  empatadas: z.number().int().min(0),
  perdidas: z.number().int().min(0),
  puntosFavor: z.number().int().min(0),
  puntosContra: z.number().int().min(0),
  puntos: z.number().int().min(0),
  esClub: z.boolean().optional(),
});

// GET /api/clasificacion
export async function getClasificacion(req: Request, res: Response, next: NextFunction) {
  try {
    const clasificacion = await prisma.posicionClasificacion.findMany({
      orderBy: { posicion: 'asc' },
    });
    sendSuccess(res, clasificacion);
  } catch (err) {
    next(err);
  }
}

// PUT /api/clasificacion — reemplaza la tabla completa
export async function updateClasificacion(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.array(posicionSchema).parse(req.body);

    await prisma.$transaction([
      prisma.posicionClasificacion.deleteMany(),
      prisma.posicionClasificacion.createMany({ data }),
    ]);

    const clasificacion = await prisma.posicionClasificacion.findMany({
      orderBy: { posicion: 'asc' },
    });
    sendSuccess(res, clasificacion);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/clasificacion/:posicion
export async function patchPosicion(req: Request, res: Response, next: NextFunction) {
  try {
    const rawPosicion = Array.isArray(req.params.posicion) ? req.params.posicion[0] : req.params.posicion;
    const posicion = parseInt(rawPosicion, 10);
    const data = posicionSchema.partial().parse(req.body);

    const registro = await prisma.posicionClasificacion.findFirst({ where: { posicion } });
    if (!registro) { sendError(res, 404, 'NOT_FOUND', 'Posición no encontrada'); return; }

    const updated = await prisma.posicionClasificacion.update({
      where: { id: registro.id },
      data,
    });
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}
