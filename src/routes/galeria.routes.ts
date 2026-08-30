import { Router } from 'express';
import { listGaleria, uploadElemento, deleteElemento } from '../controllers/galeria.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', listGaleria);
router.post('/', authenticate, requireRole('admin'), upload.single('archivo'), uploadElemento);
router.delete('/:id', authenticate, requireRole('admin'), deleteElemento);

export default router;
