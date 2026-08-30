import { Router } from 'express';
import { adminLogin, socioLogin, refreshToken, logout, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/admin/login', authRateLimiter, adminLogin);
router.post('/socio/login', authRateLimiter, socioLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
