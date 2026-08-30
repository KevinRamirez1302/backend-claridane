import { Router } from 'express';
import authRoutes from './auth.routes';
import noticiasRoutes from './noticias.routes';
import plantillaRoutes from './plantilla.routes';
import clasificacionRoutes from './clasificacion.routes';
import partidosRoutes from './partidos.routes';
import sociosRoutes from './socios.routes';
import planesRoutes from './planes.routes';
import patrocinadoresRoutes from './patrocinadores.routes';
import historiaRoutes from './historia.routes';
import galeriaRoutes from './galeria.routes';
import faqsRoutes from './faqs.routes';
import contactoRoutes from './contacto.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/noticias', noticiasRoutes);
router.use('/plantilla', plantillaRoutes);
router.use('/clasificacion', clasificacionRoutes);
router.use('/partidos', partidosRoutes);
router.use('/socios', sociosRoutes);
router.use('/planes', planesRoutes);
router.use('/patrocinadores', patrocinadoresRoutes);
router.use('/historia', historiaRoutes);
router.use('/galeria', galeriaRoutes);
router.use('/faqs', faqsRoutes);
router.use('/contacto', contactoRoutes);

export default router;
