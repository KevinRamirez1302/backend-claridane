import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/planes
export async function listPlanes(req: Request, res: Response, next: NextFunction) {
  try {
    const planes = await prisma.planMembresia.findMany();
    sendSuccess(res, planes);
  } catch (err) { next(err); }
}

// GET /api/planes/:id
export async function getPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const plan = await prisma.planMembresia.findUnique({ where: { id } });
    if (!plan) { sendError(res, 404, 'NOT_FOUND', 'Plan no encontrado'); return; }
    sendSuccess(res, plan);
  } catch (err) { next(err); }
}

// PUT /api/planes/:id
export async function updatePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const schema = z.object({
      nombre: z.string().optional(),
      precio: z.number().positive().optional(),
      beneficios: z.array(z.string()).optional(),
      destacado: z.boolean().optional(),
      color: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const plan = await prisma.planMembresia.update({ where: { id }, data });
    sendSuccess(res, plan);
  } catch (err) { next(err); }
}
