import { Router } from 'express';
import {
  listPartidos, getPartido, createPartido, updatePartido, deletePartido,
} from '../controllers/partidos.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.get('/', listPartidos);
router.get('/:id', getPartido);

router.post('/', authenticate, requireRole('admin'), createPartido);
router.put('/:id', authenticate, requireRole('admin'), updatePartido);
router.delete('/:id', authenticate, requireRole('admin'), deletePartido);

export default router;
