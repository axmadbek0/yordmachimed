import { Router } from 'express';
import { createPublicInquiry } from '../controllers/admin.controller';

const router = Router();

// Public landing inquiries
router.post('/inquiries', createPublicInquiry);

export default router;
