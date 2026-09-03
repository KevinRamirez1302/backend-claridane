import { Router } from 'express';
import {
  getMiPerfil, updateMiPerfil, cambiarPassword,
  listSocios, getSocio, toggleEstadoSocio, deleteSocio,
} from '../controllers/socios.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// Rutas de Socio autenticado (perfil propio)
router.get('/me', authenticate, requireRole('socio'), getMiPerfil);
router.patch('/me', authenticate, requireRole('socio'), updateMiPerfil);
router.post('/me/cambiar-password', authenticate, requireRole('socio'), cambiarPassword);

// Rutas de Admin
router.get('/', authenticate, requireRole('admin'), listSocios);
router.get('/:id', authenticate, requireRole('admin'), getSocio);
router.patch('/:id/estado', authenticate, requireRole('admin'), toggleEstadoSocio);
router.delete('/:id', authenticate, requireRole('admin'), deleteSocio);

export default router;
