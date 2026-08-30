import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess } from '../utils/response';

const contactoSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  mensaje: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
});

// POST /api/contacto
export async function enviarContacto(req: Request, res: Response, next: NextFunction) {
  try {
    const data = contactoSchema.parse(req.body);

    // Aquí puedes integrar Nodemailer para enviar el email
    // Por ahora se registra en consola y se responde con éxito
    console.log('📧 Nuevo mensaje de contacto:', data);

    // TODO: await emailService.send({ to: 'info@clubaridane.es', ...data })

    sendSuccess(res, { message: 'Mensaje recibido. Nos pondremos en contacto contigo pronto.' });
  } catch (err) {
    next(err);
  }
}
