import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { cloudinary } from '../config/cloudinary';
import { uploadToCloudinary } from '../middleware/upload';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/galeria
export async function listGaleria(req: Request, res: Response, next: NextFunction) {
  try {
    const galeria = await prisma.elementoGaleria.findMany({ orderBy: { fecha: 'desc' } });
    sendSuccess(res, galeria);
  } catch (err) { next(err); }
}

// POST /api/galeria
export async function uploadElemento(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { sendError(res, 400, 'NO_FILE', 'No se ha proporcionado archivo'); return; }
    
    const schema = z.object({
      tipo: z.enum(['foto', 'video']),
      titulo: z.string().min(1),
      descripcion: z.string().optional(),
      fecha: z.string().datetime().optional(),
    });
    const data = schema.parse(req.body);

    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'galeria');

    const elemento = await prisma.elementoGaleria.create({
      data: {
        tipo: data.tipo,
        url,
        publicId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
      },
    });
    sendSuccess(res, elemento, 201);
  } catch (err) { next(err); }
}

// DELETE /api/galeria/:id
export async function deleteElemento(req: Request, res: Response, next: NextFunction) {
  try {
    const elemento = await prisma.elementoGaleria.findUnique({ where: { id: Number(req.params.id) } });
    if (!elemento) { sendError(res, 404, 'NOT_FOUND', 'Elemento no encontrado'); return; }
    if (elemento.publicId) await cloudinary.uploader.destroy(elemento.publicId);
    await prisma.elementoGaleria.delete({ where: { id: elemento.id } });
    sendSuccess(res, { message: 'Elemento eliminado de la galería' });
  } catch (err) { next(err); }
}
