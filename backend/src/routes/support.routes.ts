import { Router } from 'express';
import {
  sendInquiry,
  getMyInquiries,
  getAllInquiries,
  replyInquiry,
  deleteInquiry,
} from '../controllers/support.controller';

const router = Router();

// Public / User routes
router.post('/send', sendInquiry);
router.get('/my-inquiries', getMyInquiries);

// Admin routes
router.get('/admin/all', getAllInquiries);
router.post('/admin/reply/:id', replyInquiry);
router.delete('/admin/:id', deleteInquiry);

export default router;
