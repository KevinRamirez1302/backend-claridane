import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

const hitoSchema = z.object({
  anio: z.number().int().min(1900).max(2100),
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  imagen: z.string().optional(),
});

// GET /api/historia
export async function listHistoria(req: Request, res: Response, next: NextFunction) {
  try {
    const hitos = await prisma.hitoHistorico.findMany({ orderBy: { anio: 'asc' } });
    sendSuccess(res, hitos);
  } catch (err) { next(err); }
}

// POST /api/historia
export async function createHito(req: Request, res: Response, next: NextFunction) {
  try {
    const data = hitoSchema.parse(req.body);
    const hito = await prisma.hitoHistorico.create({ data });
    sendSuccess(res, hito, 201);
  } catch (err) { next(err); }
}

// PUT /api/historia/:id
export async function updateHito(req: Request, res: Response, next: NextFunction) {
  try {
    const data = hitoSchema.partial().parse(req.body);
    const hito = await prisma.hitoHistorico.update({ where: { id: Number(req.params.id) }, data });
    sendSuccess(res, hito);
  } catch (err) { next(err); }
}

// DELETE /api/historia/:id
export async function deleteHito(req: Request, res: Response, next: NextFunction) {
  try {
    const hito = await prisma.hitoHistorico.findUnique({ where: { id: Number(req.params.id) } });
    if (!hito) { sendError(res, 404, 'NOT_FOUND', 'Hito no encontrado'); return; }
    await prisma.hitoHistorico.delete({ where: { id: hito.id } });
    sendSuccess(res, { message: 'Hito eliminado' });
  } catch (err) { next(err); }
}
