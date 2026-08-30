import { Router } from 'express';
import { listFaqs, createFaq, updateFaq, deleteFaq } from '../controllers/faqs.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.get('/', listFaqs);
router.post('/', authenticate, requireRole('admin'), createFaq);
router.put('/:id', authenticate, requireRole('admin'), updateFaq);
router.delete('/:id', authenticate, requireRole('admin'), deleteFaq);

export default router;
