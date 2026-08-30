import multer from 'multer';
import streamifier from 'streamifier';
import { Request, Response, NextFunction } from 'express';
import { cloudinary } from '../config/cloudinary';

// Multer en memoria (no escribe en disco, pasa el buffer al stream de Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagen no permitido. Usa JPG, PNG o WebP.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
});

/**
 * Sube un buffer (archivo en memoria) a Cloudinary y retorna la URL pública
 * y el public_id para poder borrarlo después.
 */
export function uploadToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `clubaridane/${folder}`,
        transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload fallido'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/**
 * Middleware de conveniencia: recibe un único archivo y lo sube a Cloudinary.
 * Añade { cloudinaryUrl, cloudinaryPublicId } a req para usarlo en el controller.
 */
export function handleUpload(folder: string) {
  return async (req: Request & { cloudinaryUrl?: string; cloudinaryPublicId?: string }, _res: Response, next: NextFunction) => {
    if (!req.file) return next();
    try {
      const { url, publicId } = await uploadToCloudinary(req.file.buffer, folder);
      req.cloudinaryUrl = url;
      req.cloudinaryPublicId = publicId;
      next();
    } catch (err) {
      next(err);
    }
  };
}
