import { Router } from 'express';
import { listPlanes, getPlan, updatePlan } from '../controllers/planes.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.get('/', listPlanes);
router.get('/:id', getPlan);
router.put('/:id', authenticate, requireRole('admin'), updatePlan);

export default router;
