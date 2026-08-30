import { Router } from 'express';
import {
  listNoticias, getNoticia, createNoticia,
  updateNoticia, patchNoticia, deleteNoticia, uploadImagenNoticia,
} from '../controllers/noticias.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { upload } from '../middleware/upload';

const router = Router();

// Rutas públicas
router.get('/', listNoticias);
router.get('/:id', getNoticia);

// Rutas protegidas - Admin
router.post('/', authenticate, requireRole('admin'), createNoticia);
router.put('/:id', authenticate, requireRole('admin'), updateNoticia);
router.patch('/:id', authenticate, requireRole('admin'), patchNoticia);
router.delete('/:id', authenticate, requireRole('admin'), deleteNoticia);
router.post('/:id/imagen', authenticate, requireRole('admin'), upload.single('imagen'), uploadImagenNoticia);

export default router;
