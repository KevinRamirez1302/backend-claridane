import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

const partidoSchema = z.object({
  esLocal: z.boolean(),
  rival: z.string().min(1),
  logoRival: z.string().min(1),
  competicion: z.string().min(1),
  fecha: z.string().datetime(),
  resultado: z.string().nullable().optional(),
  esProximo: z.boolean().optional(),
});

// GET /api/partidos
export async function listPartidos(req: Request, res: Response, next: NextFunction) {
  try {
    const { esProximo } = req.query as { esProximo?: string };
    const where = esProximo !== undefined ? { esProximo: esProximo === 'true' } : {};
    const partidos = await prisma.partido.findMany({ where, orderBy: { fecha: 'asc' } });
    sendSuccess(res, partidos);
  } catch (err) {
    next(err);
  }
}

// GET /api/partidos/:id
export async function getPartido(req: Request, res: Response, next: NextFunction) {
  try {
    const partido = await prisma.partido.findUnique({ where: { id: Number(req.params.id) } });
    if (!partido) { sendError(res, 404, 'NOT_FOUND', 'Partido no encontrado'); return; }
    sendSuccess(res, partido);
  } catch (err) {
    next(err);
  }
}

// POST /api/partidos
export async function createPartido(req: Request, res: Response, next: NextFunction) {
  try {
    const data = partidoSchema.parse(req.body);
    const partido = await prisma.partido.create({ data: { ...data, fecha: new Date(data.fecha) } });
    sendSuccess(res, partido, 201);
  } catch (err) {
    next(err);
  }
}

// PUT /api/partidos/:id
export async function updatePartido(req: Request, res: Response, next: NextFunction) {
  try {
    const data = partidoSchema.parse(req.body);
    const partido = await prisma.partido.update({
      where: { id: Number(req.params.id) },
      data: { ...data, fecha: new Date(data.fecha) },
    });
    sendSuccess(res, partido);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/partidos/:id
export async function deletePartido(req: Request, res: Response, next: NextFunction) {
  try {
    const partido = await prisma.partido.findUnique({ where: { id: Number(req.params.id) } });
    if (!partido) { sendError(res, 404, 'NOT_FOUND', 'Partido no encontrado'); return; }
    await prisma.partido.delete({ where: { id: partido.id } });
    sendSuccess(res, { message: 'Partido eliminado correctamente' });
  } catch (err) {
    next(err);
  }
}
