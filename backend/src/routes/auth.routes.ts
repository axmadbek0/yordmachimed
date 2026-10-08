import { Router } from 'express';
import { login, refreshToken, logout, register, me, googleLogin } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/login', authRateLimiter, login);
router.post('/google', authRateLimiter, googleLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, me);

router.post(
  '/register',
  authenticate,
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  register
);

export default router;
