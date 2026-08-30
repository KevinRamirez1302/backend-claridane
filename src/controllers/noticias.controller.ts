import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { cloudinary } from '../config/cloudinary';
import { uploadToCloudinary } from '../middleware/upload';
import { sendSuccess, sendPaginated, sendError } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';

const noticiaSchema = z.object({
  titulo: z.string().min(1),
  resumen: z.string().min(1),
  contenido: z.string().min(1),
  imagen: z.string().optional(),
  fecha: z.string().datetime(),
  categoria: z.enum(['club', 'competicion', 'fichaje', 'institucional']),
  autor: z.string().min(1),
});

// GET /api/noticias
export async function listNoticias(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
    const { categoria, q } = req.query as { categoria?: string; q?: string };

    const where = {
      ...(categoria ? { categoria: categoria as 'club' | 'competicion' | 'fichaje' | 'institucional' } : {}),
      ...(q
        ? {
            OR: [
              { titulo: { contains: q, mode: 'insensitive' as const } },
              { resumen: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [noticias, total] = await Promise.all([
      prisma.noticia.findMany({ where, orderBy: { fecha: 'desc' }, skip, take: limit }),
      prisma.noticia.count({ where }),
    ]);

    sendPaginated(res, noticias, { page, limit, total });
  } catch (err) {
    next(err);
  }
}

// GET /api/noticias/:id
export async function getNoticia(req: Request, res: Response, next: NextFunction) {
  try {
    const noticia = await prisma.noticia.findUnique({ where: { id: Number(req.params.id) } });
    if (!noticia) { sendError(res, 404, 'NOT_FOUND', 'Noticia no encontrada'); return; }
    sendSuccess(res, noticia);
  } catch (err) {
    next(err);
  }
}

// POST /api/noticias
export async function createNoticia(req: Request, res: Response, next: NextFunction) {
  try {
    const data = noticiaSchema.parse(req.body);
    const noticia = await prisma.noticia.create({
      data: { ...data, imagen: data.imagen ?? '', fecha: new Date(data.fecha) },
    });
    sendSuccess(res, noticia, 201);
  } catch (err) {
    next(err);
  }
}

// PUT /api/noticias/:id
export async function updateNoticia(req: Request, res: Response, next: NextFunction) {
  try {
    const data = noticiaSchema.parse(req.body);
    const noticia = await prisma.noticia.update({
      where: { id: Number(req.params.id) },
      data: { ...data, fecha: new Date(data.fecha) },
    });
    sendSuccess(res, noticia);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/noticias/:id
export async function patchNoticia(req: Request, res: Response, next: NextFunction) {
  try {
    const data = noticiaSchema.partial().parse(req.body);
    const noticia = await prisma.noticia.update({
      where: { id: Number(req.params.id) },
      data: { ...data, ...(data.fecha ? { fecha: new Date(data.fecha) } : {}) },
    });
    sendSuccess(res, noticia);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/noticias/:id
export async function deleteNoticia(req: Request, res: Response, next: NextFunction) {
  try {
    const noticia = await prisma.noticia.findUnique({ where: { id: Number(req.params.id) } });
    if (!noticia) { sendError(res, 404, 'NOT_FOUND', 'Noticia no encontrada'); return; }

    if (noticia.imagenPublicId) {
      await cloudinary.uploader.destroy(noticia.imagenPublicId);
    }

    await prisma.noticia.delete({ where: { id: noticia.id } });
    sendSuccess(res, { message: 'Noticia eliminada correctamente' });
  } catch (err) {
    next(err);
  }
}

// POST /api/noticias/:id/imagen
export async function uploadImagenNoticia(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { sendError(res, 400, 'NO_FILE', 'No se ha proporcionado ninguna imagen'); return; }

    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'noticias');

    const noticia = await prisma.noticia.update({
      where: { id: Number(req.params.id) },
      data: { imagen: url, imagenPublicId: publicId },
    });
    sendSuccess(res, { url: noticia.imagen });
  } catch (err) {
    next(err);
  }
}
