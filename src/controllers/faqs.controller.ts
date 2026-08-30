import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

const faqSchema = z.object({
  pregunta: z.string().min(1),
  respuesta: z.string().min(1),
  orden: z.number().int().optional(),
});

// GET /api/faqs
export async function listFaqs(req: Request, res: Response, next: NextFunction) {
  try {
    const faqs = await prisma.fAQ.findMany({ orderBy: { orden: 'asc' } });
    sendSuccess(res, faqs);
  } catch (err) { next(err); }
}

// POST /api/faqs
export async function createFaq(req: Request, res: Response, next: NextFunction) {
  try {
    const data = faqSchema.parse(req.body);
    const faq = await prisma.fAQ.create({ data });
    sendSuccess(res, faq, 201);
  } catch (err) { next(err); }
}

// PUT /api/faqs/:id
export async function updateFaq(req: Request, res: Response, next: NextFunction) {
  try {
    const data = faqSchema.partial().parse(req.body);
    const faq = await prisma.fAQ.update({ where: { id: Number(req.params.id) }, data });
    sendSuccess(res, faq);
  } catch (err) { next(err); }
}

// DELETE /api/faqs/:id
export async function deleteFaq(req: Request, res: Response, next: NextFunction) {
  try {
    const faq = await prisma.fAQ.findUnique({ where: { id: Number(req.params.id) } });
    if (!faq) { sendError(res, 404, 'NOT_FOUND', 'FAQ no encontrada'); return; }
    await prisma.fAQ.delete({ where: { id: faq.id } });
    sendSuccess(res, { message: 'FAQ eliminada' });
  } catch (err) { next(err); }
}
