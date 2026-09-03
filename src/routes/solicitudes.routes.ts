import { Router } from 'express';
import { getAllSolicitudes, createSolicitud, acceptSolicitud, rejectSolicitud } from '../controllers/solicitudes.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.get('/', authenticate, requireRole('admin'), getAllSolicitudes);
router.post('/', createSolicitud); // Público — formulario del sitio web
router.put('/:id/accept', authenticate, requireRole('admin'), acceptSolicitud);
router.put('/:id/reject', authenticate, requireRole('admin'), rejectSolicitud);

export default router;
