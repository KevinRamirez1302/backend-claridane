import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { cloudinary } from '../config/cloudinary';
import { uploadToCloudinary } from '../middleware/upload';
import { sendSuccess, sendError } from '../utils/response';

const patroSchema = z.object({
  nombre: z.string().min(1),
  logo: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  nivel: z.enum(['principal', 'oficial', 'colaborador']),
});

// GET /api/patrocinadores
export async function listPatrocinadores(req: Request, res: Response, next: NextFunction) {
  try {
    const patrocinadores = await prisma.patrocinador.findMany({ orderBy: { nivel: 'asc' } });
    sendSuccess(res, patrocinadores);
  } catch (err) { next(err); }
}

// POST /api/patrocinadores
export async function createPatrocinador(req: Request, res: Response, next: NextFunction) {
  try {
    const data = patroSchema.parse(req.body);
    const p = await prisma.patrocinador.create({ data: { ...data, logo: data.logo ?? '' } });
    sendSuccess(res, p, 201);
  } catch (err) { next(err); }
}

// PUT /api/patrocinadores/:id
export async function updatePatrocinador(req: Request, res: Response, next: NextFunction) {
  try {
    const data = patroSchema.partial().parse(req.body);
    const p = await prisma.patrocinador.update({ where: { id: Number(req.params.id) }, data });
    sendSuccess(res, p);
  } catch (err) { next(err); }
}

// DELETE /api/patrocinadores/:id
export async function deletePatrocinador(req: Request, res: Response, next: NextFunction) {
  try {
    const p = await prisma.patrocinador.findUnique({ where: { id: Number(req.params.id) } });
    if (!p) { sendError(res, 404, 'NOT_FOUND', 'Patrocinador no encontrado'); return; }
    if (p.logoPublicId) await cloudinary.uploader.destroy(p.logoPublicId);
    await prisma.patrocinador.delete({ where: { id: p.id } });
    sendSuccess(res, { message: 'Patrocinador eliminado' });
  } catch (err) { next(err); }
}

// POST /api/patrocinadores/:id/logo
export async function uploadLogoPatrocinador(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { sendError(res, 400, 'NO_FILE', 'No se ha proporcionado logo'); return; }
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'patrocinadores');
    const p = await prisma.patrocinador.update({
      where: { id: Number(req.params.id) },
      data: { logo: url, logoPublicId: publicId },
    });
    sendSuccess(res, { url: p.logo });
  } catch (err) { next(err); }
}
