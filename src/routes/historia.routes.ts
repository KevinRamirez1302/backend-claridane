import { Router } from 'express';
import { listHistoria, createHito, updateHito, deleteHito } from '../controllers/historia.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.get('/', listHistoria);
router.post('/', authenticate, requireRole('admin'), createHito);
router.put('/:id', authenticate, requireRole('admin'), updateHito);
router.delete('/:id', authenticate, requireRole('admin'), deleteHito);

export default router;
