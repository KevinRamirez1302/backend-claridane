import { Router } from 'express';
import { listEquipos, getEquipo, createEquipo, updateEquipo, deleteEquipo } from '../controllers/equipos.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// Rutas públicas (lectura)
router.get('/', listEquipos);
router.get('/:id', getEquipo);

// Rutas protegidas — Admin only
router.post('/', authenticate, requireRole('admin'), createEquipo);
router.put('/:id', authenticate, requireRole('admin'), updateEquipo);
router.delete('/:id', authenticate, requireRole('admin'), deleteEquipo);

export default router;
