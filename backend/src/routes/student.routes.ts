import { Router } from 'express';
import {
  create,
  getAll,
  getOne,
  getMyChildren,
} from '../controllers/student.controller';
import { createDailyLog } from '../controllers/dailyLog.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { aiRateLimiter } from '../middlewares/rateLimiter';
import { createStudentSchema, studentIdParamSchema } from '../validations/student.validation';
import { createDailyLogSchema } from '../validations/dailyLog.validation';

const router = Router();

router.use(authenticate);

/** PARENT — faqat o'z farzandlari */
router.get('/me/children', authorizeRoles('PARENT'), getMyChildren);

/** Barcha autentifikatsiyadan o'tganlar — rol bo'yicha filtr service'da */
router.get(
  '/',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT'),
  getAll
);

/** Yangi o'quvchi — TEACHER / SCHOOL_ADMIN / SUPER_ADMIN */
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(createStudentSchema),
  create
);

router.post(
  '/daily-logs',
  aiRateLimiter,
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(createDailyLogSchema),
  createDailyLog
);

router.get(
  '/:id',
  authorizeRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT'),
  validate(studentIdParamSchema, 'params'),
  getOne
);

export default router;
