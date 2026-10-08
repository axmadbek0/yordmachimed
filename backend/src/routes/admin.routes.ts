import { Router } from 'express';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin';
import {
  superAdminLogin,
  getSuperAdminMe,
  getAdminDashboard,
  getAdminSchools,
  createAdminSchool,
  getAdminSchoolById,
  updateAdminSchool,
  updateAdminSchoolStatus,
  deleteAdminSchool,
  getAdminUsers,
  resetAdminUserCredentials,
  toggleAdminUserStatus,
  getAdminAnalytics,
  getAdminBilling,
  recordAdminPayment,
  updateAdminPaymentStatus,
  getAdminInquiries,
  updateAdminInquiryStatus,
  deleteAdminInquiry,
  getAdminSettings,
  updateAdminSettings,
  getAdminAuditLogs,
} from '../controllers/admin.controller';

const router = Router();

// ==========================================
// 1. Ochiq autentifikatsiya endpointi
// ==========================================
router.post('/auth/login', superAdminLogin);

// ==========================================
// 2. Super-Admin himoyalangan endpointlari
// ==========================================
router.use(requireSuperAdmin);

// Auth Me
router.get('/auth/me', getSuperAdminMe);

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Maktablar (Schools)
router.get('/schools', getAdminSchools);
router.post('/schools', createAdminSchool);
router.get('/schools/:id', getAdminSchoolById);
router.patch('/schools/:id', updateAdminSchool);
router.patch('/schools/:id/status', updateAdminSchoolStatus);
router.delete('/schools/:id', deleteAdminSchool);

// Foydalanuvchilar (Users / Teachers)
router.get('/users', getAdminUsers);
router.post('/users/:id/reset-credentials', resetAdminUserCredentials);
router.patch('/users/:id/status', toggleAdminUserStatus);

// Tahlil (Analytics)
router.get('/analytics', getAdminAnalytics);

// Billing va To'lovlar
router.get('/billing', getAdminBilling);
router.post('/billing/payments', recordAdminPayment);
router.patch('/billing/payments/:id', updateAdminPaymentStatus);

// Murojaatlar (Inquiries)
router.get('/inquiries', getAdminInquiries);
router.patch('/inquiries/:id', updateAdminInquiryStatus);
router.delete('/inquiries/:id', deleteAdminInquiry);

// Sozlamalar (Settings)
router.get('/settings', getAdminSettings);
router.patch('/settings', updateAdminSettings);

// Audit jurnali
router.get('/audit-logs', getAdminAuditLogs);

export default router;
