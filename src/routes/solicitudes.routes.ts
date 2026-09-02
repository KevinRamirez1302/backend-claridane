import { Router } from 'express';
import { getAllSolicitudes, createSolicitud, acceptSolicitud, rejectSolicitud } from '../controllers/solicitudes.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', authenticate, getAllSolicitudes);
router.post('/', createSolicitud); // Público
router.put('/:id/accept', authenticate, acceptSolicitud);
router.put('/:id/reject', authenticate, rejectSolicitud);

export default router;
