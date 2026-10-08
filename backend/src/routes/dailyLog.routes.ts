import { Router } from 'express';
import { createDailyLog } from '../controllers/dailyLog.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { aiRateLimiter } from '../middlewares/rateLimiter';
import { createDailyLogSchema } from '../validations/dailyLog.validation';

const router = Router();

router.post(
  '/',
  aiRateLimiter,
  authenticate,
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(createDailyLogSchema),
  createDailyLog
);

export default router;
