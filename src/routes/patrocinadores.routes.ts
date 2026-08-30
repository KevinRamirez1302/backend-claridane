import { Router } from 'express';
import {
  listPatrocinadores, createPatrocinador, updatePatrocinador,
  deletePatrocinador, uploadLogoPatrocinador,
} from '../controllers/patrocinadores.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', listPatrocinadores);

router.post('/', authenticate, requireRole('admin'), createPatrocinador);
router.put('/:id', authenticate, requireRole('admin'), updatePatrocinador);
router.delete('/:id', authenticate, requireRole('admin'), deletePatrocinador);
router.post('/:id/logo', authenticate, requireRole('admin'), upload.single('logo'), uploadLogoPatrocinador);

export default router;
