import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

const equipoSchema = z.object({
  nombre: z.string().min(1),
  municipio: z.string().min(1),
  isla: z.string().min(1),
  terrero: z.string().min(1),
  categoria: z.string().min(1),
  logo: z.string().optional().nullable(),
});

// GET /api/equipos
export async function listEquipos(req: Request, res: Response, next: NextFunction) {
  try {
    const equipos = await prisma.equipoRival.findMany({
      orderBy: { nombre: 'asc' },
    });
    sendSuccess(res, equipos);
  } catch (err) {
    next(err);
  }
}

// GET /api/equipos/:id
export async function getEquipo(req: Request, res: Response, next: NextFunction) {
  try {
    const equipo = await prisma.equipoRival.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!equipo) { sendError(res, 404, 'NOT_FOUND', 'Equipo no encontrado'); return; }
    sendSuccess(res, equipo);
  } catch (err) {
    next(err);
  }
}

// POST /api/equipos
export async function createEquipo(req: Request, res: Response, next: NextFunction) {
  try {
    const data = equipoSchema.parse(req.body);
    const equipo = await prisma.equipoRival.create({ data });
    sendSuccess(res, equipo, 201);
  } catch (err) {
    next(err);
  }
}

// PUT /api/equipos/:id
export async function updateEquipo(req: Request, res: Response, next: NextFunction) {
  try {
    const data = equipoSchema.parse(req.body);
    const equipo = await prisma.equipoRival.update({
      where: { id: Number(req.params.id) },
      data,
    });
    sendSuccess(res, equipo);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/equipos/:id
export async function deleteEquipo(req: Request, res: Response, next: NextFunction) {
  try {
    const equipo = await prisma.equipoRival.findUnique({ where: { id: Number(req.params.id) } });
    if (!equipo) { sendError(res, 404, 'NOT_FOUND', 'Equipo no encontrado'); return; }
    await prisma.equipoRival.delete({ where: { id: equipo.id } });
    sendSuccess(res, { message: 'Equipo eliminado correctamente' });
  } catch (err) {
    next(err);
  }
}
