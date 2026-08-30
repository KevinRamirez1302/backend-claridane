import { Router } from 'express';
import {
  listPlantilla, getJugador, createJugador,
  updateJugador, deleteJugador, uploadFotoJugador,
} from '../controllers/plantilla.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', listPlantilla);
router.get('/:id', getJugador);

router.post('/', authenticate, requireRole('admin'), createJugador);
router.put('/:id', authenticate, requireRole('admin'), updateJugador);
router.delete('/:id', authenticate, requireRole('admin'), deleteJugador);
router.post('/:id/foto', authenticate, requireRole('admin'), upload.single('foto'), uploadFotoJugador);

export default router;
