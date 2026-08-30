import { Router } from 'express';
import { getClasificacion, updateClasificacion, patchPosicion } from '../controllers/clasificacion.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.get('/', getClasificacion);
router.put('/', authenticate, requireRole('admin'), updateClasificacion);
router.patch('/:posicion', authenticate, requireRole('admin'), patchPosicion);

export default router;
