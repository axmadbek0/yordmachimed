import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types/auth.types';
import {
  superAdminLoginSchema,
  createSchoolSchema,
  updateSchoolSchema,
  updateSchoolStatusSchema,
  resetCredentialsSchema,
  updateInquirySchema,
  publicInquirySchema,
  siteContentUpdateSchema,
  recordPaymentSchema,
} from '../validations/admin.validation';
import {
  createFirstTeacherForSchool,
  resetUserCredentials,
  logAdminAction,
  computePlatformAnalytics,
} from '../lib/adminActions';

// ==========================================
// 1. AUTENTIFIKATSIYA
// ==========================================

export async function superAdminLogin(req: Request, res: Response) {
  try {
    const { login, email, password } = superAdminLoginSchema.parse(req.body);
    const identifier = (email || login || '').trim();

    // 1. Try SuperAdmin table
    let superAdmin = await prisma.superAdmin.findFirst({
      where: {
        OR: [{ login: identifier }, { email: identifier }],
      },
    });

    let adminId = '';
    let displayName = 'Super Admin';
    let adminEmail = identifier;
    let passwordHash = '';

    if (superAdmin) {
      adminId = superAdmin.id;
      displayName = superAdmin.displayName;
      adminEmail = superAdmin.email || superAdmin.login;
      passwordHash = superAdmin.passwordHash;
    } else {
      // 2. Fallback to User table where role is SUPER_ADMIN
      const userAdmin = await prisma.user.findFirst({
        where: {
          login: identifier,
          role: 'SUPER_ADMIN',
        },
      });

      if (!userAdmin) {
        return res.status(401).json({ success: false, error: 'Login yoki parol noto\'g\'ri' });
      }

      adminId = userAdmin.id;
      displayName = userAdmin.full_name || 'Super Admin';
      adminEmail = userAdmin.login;
      passwordHash = userAdmin.password_hash;
    }

    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Login yoki parol noto\'g\'ri' });
    }

    const jwtSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(
      {
        sub: adminId,
        userId: adminId,
        role: 'super_admin',
      },
      jwtSecret,
      { expiresIn: '8h' }
    );

    // Update lastLoginAt
    if (superAdmin) {
      await prisma.superAdmin.update({
        where: { id: superAdmin.id },
        data: { lastLoginAt: new Date() },
      });
    } else {
      await prisma.user.update({
        where: { id: adminId },
        data: { last_login_at: new Date() },
      });
    }

    await logAdminAction(adminId, 'SUPER_ADMIN_LOGIN', 'SuperAdmin', adminId);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: adminId,
          role: 'super_admin',
          displayName,
          email: adminEmail,
        },
      },
    });
  } catch (err: any) {
    console.error('superAdminLogin error:', err);
    return res.status(400).json({ success: false, error: err.message || 'Kirishda xatolik yuz berdi' });
  }
}

export async function getSuperAdminMe(req: AuthRequest, res: Response) {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      return res.status(401).json({ success: false, error: 'Avtorizatsiyadan o\'tilmagan' });
    }

    const superAdmin = await prisma.superAdmin.findUnique({ where: { id: adminId } });
    if (superAdmin) {
      return res.json({
        success: true,
        data: {
          id: superAdmin.id,
          role: 'super_admin',
          displayName: superAdmin.displayName,
          email: superAdmin.email || superAdmin.login,
          lastLoginAt: superAdmin.lastLoginAt,
        },
      });
    }

    const userAdmin = await prisma.user.findUnique({ where: { id: adminId } });
    if (userAdmin) {
      return res.json({
        success: true,
        data: {
          id: userAdmin.id,
          role: 'super_admin',
          displayName: userAdmin.full_name || 'Super Admin',
          email: userAdmin.login,
          lastLoginAt: userAdmin.last_login_at,
        },
      });
    }

    return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// 2. DASHBOARD
// ==========================================

export async function getAdminDashboard(_req: AuthRequest, res: Response) {
  try {
    const [schools, teachers, students, newInquiries, recentLogs, subscriptions] = await Promise.all([
      prisma.school.findMany({
        include: { _count: { select: { users: true, students: true } } },
      }),
      prisma.user.findMany({ where: { role: { in: ['TEACHER', 'SCHOOL_ADMIN'] } } }),
      prisma.student.findMany(),
      prisma.inquiry.count({ where: { status: 'NEW' } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.subscription.findMany({ where: { status: 'OVERDUE' }, include: { school: true } }),
    ]);

    const activeSchools = schools.filter((s) => s.status === 'ACTIVE' || s.status === 'active');
    const pendingSchools = schools.filter((s) => s.status === 'PENDING' || s.status === 'pending');

    const platformStats = {
      totalSchools: schools.length,
      totalTeachers: teachers.length,
      totalStudents: students.length,
      activeChatsToday: Math.round(students.length * 0.45) || 12,
      schoolsTrend: 8,
      teachersTrend: 12,
      studentsTrend: 15,
      chatsTrend: 5,
    };

    const activityFeed = recentLogs.map((log) => ({
      id: log.id,
      message: `${log.action} bajarildi (${log.targetType})`,
      timestamp: log.createdAt.toISOString(),
      type: log.targetType === 'School' ? 'school' : log.targetType === 'Teacher' ? 'teacher' : 'system',
    }));

    const attentionItems: Array<{ id: string; message: string; type: 'pending_school' | 'overdue_payment' | 'system_alert'; link: string }> = [];

    for (const ps of pendingSchools) {
      attentionItems.push({
        id: `att-sch-${ps.id}`,
        message: `${ps.number}-sonli maktab tasdiqlashni kutmoqda`,
        type: 'pending_school',
        link: `/admin/schools/${ps.id}`,
      });
    }

    for (const sub of subscriptions) {
      attentionItems.push({
        id: `att-sub-${sub.id}`,
        message: `${sub.school.name} bo'yicha to'lov muddati o'tgan`,
        type: 'overdue_payment',
        link: '/admin/billing',
      });
    }

    return res.json({
      success: true,
      data: {
        schoolCount: activeSchools.length,
        teacherCount: teachers.length,
        studentCount: students.length,
        pendingInquiries: newInquiries,
        platformStats,
        activityFeed,
        attentionItems,
      },
    });
  } catch (err: any) {
    console.error('getAdminDashboard error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// 3. MAKTABLAR (SCHOOLS)
// ==========================================

function formatSchool(s: any) {
  let photoUrls: string[] = [];
  try {
    if (s.photoUrls) photoUrls = JSON.parse(s.photoUrls);
    else if (s.photos) photoUrls = JSON.parse(s.photos);
  } catch {}

  let faqItems: any[] = [];
  try {
    if (s.faqItems) faqItems = JSON.parse(s.faqItems);
  } catch {}

  const teacherCount = s._count?.users ?? (Array.isArray(s.users) ? s.users.length : 0);
  const studentCount = s._count?.students ?? (Array.isArray(s.students) ? s.students.length : 0);

  return {
    id: s.id,
    number: s.number,
    name: s.name,
    region: s.region || 'Toshkent shahri',
    district: s.district || '',
    address: s.address || '',
    phone: s.phone || '',
    classCount: s.classCount ?? 0,
    status: (s.status || 'active').toLowerCase(),
    teacherCount,
    studentCount,
    createdAt: s.created_at ? s.created_at.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    lat: s.lat,
    lng: s.lng,
    description: s.description || '',
    workingHours: s.workingHours || '',
    foundedYear: s.foundedYear,
    isVerified: Boolean(s.isVerified),
    licenseNumber: s.licenseNumber,
    ageRangeMin: s.ageRangeMin,
    ageRangeMax: s.ageRangeMax,
    photoUrls,
    faqItems,
  };
}

export async function getAdminSchools(req: AuthRequest, res: Response) {
  try {
    const { search, status, region } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { address: { contains: String(search) } },
      ];
    }
    if (status && status !== 'all') {
      where.status = { equals: String(status).toUpperCase() };
    }
    if (region && region !== 'Barchasi') {
      where.region = { equals: String(region) };
    }

    const schools = await prisma.school.findMany({
      where,
      include: {
        _count: { select: { users: true, students: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({
      success: true,
      data: schools.map(formatSchool),
    });
  } catch (err: any) {
    console.error('getAdminSchools error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function createAdminSchool(req: AuthRequest, res: Response) {
  try {
    const data = createSchoolSchema.parse(req.body);

    const existing = await prisma.school.findUnique({
      where: { number: data.number },
    });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Bu maktab raqami band' });
    }

    const school = await prisma.school.create({
      data: {
        number: data.number,
        name: data.name,
        region: data.region || 'Toshkent shahri',
        district: data.district,
        address: data.address,
        phone: data.phone,
        classCount: data.classCount || 0,
        description: data.description,
        lat: data.lat,
        lng: data.lng,
        workingHours: data.workingHours,
        foundedYear: data.foundedYear,
        isVerified: data.isVerified ?? false,
        licenseNumber: data.licenseNumber,
        ageRangeMin: data.ageRangeMin,
        ageRangeMax: data.ageRangeMax,
        photoUrls: data.photoUrls ? JSON.stringify(data.photoUrls) : null,
        faqItems: data.faqItems ? JSON.stringify(data.faqItems) : null,
        status: 'ACTIVE',
      },
    });

    // Create subscription
    await prisma.subscription.create({
      data: {
        schoolId: school.id,
        status: 'TRIAL',
        plan: 'Standart',
        monthlyAmount: 1500000,
        nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Auto-generate first teacher credentials
    const credentials = await createFirstTeacherForSchool(school.id, school.number);

    await logAdminAction(req.adminId || 'admin', 'SCHOOL_CREATED', 'School', school.id, {
      schoolNumber: school.number,
      name: school.name,
    });

    const formatted = formatSchool(school);

    return res.status(201).json({
      success: true,
      data: {
        school: formatted,
        firstTeacherCredentials: credentials,
        teacherLogin: credentials.login,
        teacherPassword: credentials.password,
      },
    });
  } catch (err: any) {
    console.error('createAdminSchool error:', err);
    return res.status(400).json({ success: false, error: err.message || 'Maktab qo\'shishda xatolik' });
  }
}

export async function getAdminSchoolById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        users: { where: { role: { in: ['TEACHER', 'SCHOOL_ADMIN'] } } },
        subscription: true,
        _count: { select: { users: true, students: true } },
      },
    });

    if (!school) {
      return res.status(404).json({ success: false, error: 'Maktab topilmadi' });
    }

    const formattedSchool = formatSchool(school);
    const formattedTeachers = (school.users || []).map((u) => ({
      id: u.id,
      fullName: u.full_name || 'Noma\'lum o\'qituvchi',
      login: u.login,
      password: '••••••••',
      schoolId: school.id,
      schoolNumber: school.number,
      schoolName: school.name,
      lastActivity: u.last_login_at?.toISOString() || u.updated_at.toISOString(),
      status: (u.status || 'active').toLowerCase(),
      role: u.role === 'SCHOOL_ADMIN' ? 'school_admin' : 'teacher',
    }));

    return res.json({
      success: true,
      data: {
        ...formattedSchool,
        teachers: formattedTeachers,
        subscription: school.subscription,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateAdminSchool(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = updateSchoolSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.status) {
      updateData.status = data.status.toUpperCase();
    }
    if (data.photoUrls) {
      updateData.photoUrls = JSON.stringify(data.photoUrls);
    }
    if (data.faqItems) {
      updateData.faqItems = JSON.stringify(data.faqItems);
    }

    const school = await prisma.school.update({
      where: { id },
      data: updateData,
    });

    await logAdminAction(req.adminId || 'admin', 'SCHOOL_UPDATED', 'School', school.id, data);

    return res.json({
      success: true,
      data: formatSchool(school),
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function updateAdminSchoolStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = updateSchoolStatusSchema.parse(req.body);
    const dbStatus = status.toUpperCase();

    const school = await prisma.school.update({
      where: { id },
      data: { status: dbStatus },
    });

    // If suspended, block teachers
    if (dbStatus === 'SUSPENDED') {
      await prisma.user.updateMany({
        where: { school_id: id },
        data: { status: 'blocked' },
      });
    } else if (dbStatus === 'ACTIVE') {
      await prisma.user.updateMany({
        where: { school_id: id },
        data: { status: 'active' },
      });
    }

    await logAdminAction(req.adminId || 'admin', 'SCHOOL_STATUS_CHANGED', 'School', school.id, {
      newStatus: dbStatus,
    });

    return res.json({
      success: true,
      data: formatSchool(school),
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteAdminSchool(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // Soft-deactivate by setting status to SUSPENDED
    const school = await prisma.school.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });

    await prisma.user.updateMany({
      where: { school_id: id },
      data: { status: 'blocked' },
    });

    await logAdminAction(req.adminId || 'admin', 'SCHOOL_DEACTIVATED', 'School', id);

    return res.json({
      success: true,
      message: 'Maktab to\'xtatildi',
      data: formatSchool(school),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// 4. FOYDALANUVCHILAR (USERS / TEACHERS)
// ==========================================

export async function getAdminUsers(req: AuthRequest, res: Response) {
  try {
    const { role, schoolId } = req.query;

    const where: any = {};
    if (role === 'teacher') {
      where.role = 'TEACHER';
    } else if (role === 'school_admin') {
      where.role = 'SCHOOL_ADMIN';
    } else {
      where.role = { in: ['TEACHER', 'SCHOOL_ADMIN'] };
    }

    if (schoolId) {
      where.school_id = String(schoolId);
    }

    const users = await prisma.user.findMany({
      where,
      include: { school: { select: { name: true, number: true } } },
      orderBy: { created_at: 'desc' },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      fullName: u.full_name || 'Noma\'lum foydalanuvchi',
      login: u.login,
      password: '••••••••',
      schoolId: u.school_id || '',
      schoolNumber: u.school?.number || 0,
      schoolName: u.school?.name || '',
      lastActivity: u.last_login_at?.toISOString() || u.updated_at.toISOString(),
      status: (u.status || 'active').toLowerCase(),
      role: u.role === 'SCHOOL_ADMIN' ? 'school_admin' : 'teacher',
    }));

    return res.json({ success: true, data: formattedUsers });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function resetAdminUserCredentials(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role } = resetCredentialsSchema.parse(req.body);

    const result = await resetUserCredentials(id, role);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });
    }

    await logAdminAction(req.adminId || 'admin', 'CREDENTIALS_RESET', role || 'User', id);

    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function toggleAdminUserStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });
    }

    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    const updated = await prisma.user.update({
      where: { id },
      data: { status: newStatus },
      include: { school: true },
    });

    await logAdminAction(req.adminId || 'admin', 'USER_STATUS_TOGGLED', 'User', id, { newStatus });

    return res.json({
      success: true,
      data: {
        id: updated.id,
        fullName: updated.full_name,
        login: updated.login,
        status: updated.status,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// 5. TAHLIL (ANALYTICS)
// ==========================================

export async function getAdminAnalytics(req: AuthRequest, res: Response) {
  try {
    const { period = 'month' } = req.query;
    const data = await computePlatformAnalytics(String(period));
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ==========================================
// 6. BILLING VA TO'LOVLAR
// ==========================================

export async function getAdminBilling(_req: AuthRequest, res: Response) {
  try {
    const [subscriptions, userPayments] = await Promise.all([
      prisma.subscription.findMany({
        include: { school: { select: { name: true, number: true } } },
        orderBy: { nextBillingAt: 'asc' },
      }),
      prisma.userPayment.findMany({
        orderBy: { paymentDate: 'desc' },
      }),
    ]);

    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      schoolId: sub.schoolId,
      schoolNumber: sub.school?.number || 0,
      schoolName: sub.school?.name || '',
      status: (sub.status || 'active').toLowerCase(),
      nextPayment: sub.nextBillingAt ? sub.nextBillingAt.toISOString().split('T')[0] : '',
      amount: sub.monthlyAmount,
      plan: sub.plan,
    }));

    return res.json({
      success: true,
      data: {
        subscriptions: formattedSubscriptions,
        userPayments,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function recordAdminPayment(req: AuthRequest, res: Response) {
  try {
    const data = recordPaymentSchema.parse(req.body);

    const payment = await prisma.userPayment.create({
      data: {
        transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        userName: data.userName,
        userRole: data.userRole,
        userPhone: data.userPhone,
        studentName: data.studentName,
        schoolNumber: data.schoolNumber,
        planName: data.planName,
        amount: data.amount,
        provider: data.provider,
        status: data.status,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cardNumberMasked: data.cardNumberMasked || '8600 •••• •••• 1234',
      },
    });

    await logAdminAction(req.adminId || 'admin', 'PAYMENT_RECORDED', 'UserPayment', payment.id, {
      amount: payment.amount,
    });

    return res.status(201).json({ success: true, data: payment });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function updateAdminPaymentStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await prisma.userPayment.update({
      where: { id },
      data: { status },
    });

    return res.json({ success: true, data: payment });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// ==========================================
// 7. MUROJAATLAR (INQUIRIES)
// ==========================================

export async function getAdminInquiries(req: AuthRequest, res: Response) {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = String(status).toUpperCase();
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: inquiries,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateAdminInquiryStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, adminReply } = updateInquirySchema.parse(req.body);

    const updateData: any = {};
    if (status) {
      updateData.status = status.toUpperCase();
      if (status.toUpperCase() === 'RESOLVED' || status === 'replied') {
        updateData.resolvedAt = new Date();
      }
    }
    if (adminReply) {
      updateData.adminReply = adminReply;
    }

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: updateData,
    });

    await logAdminAction(req.adminId || 'admin', 'INQUIRY_UPDATED', 'Inquiry', id, updateData);

    return res.json({ success: true, data: inquiry });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteAdminInquiry(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.inquiry.delete({ where: { id } });
    await logAdminAction(req.adminId || 'admin', 'INQUIRY_DELETED', 'Inquiry', id);
    return res.json({ success: true, message: 'Murojaat o\'chirildi' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Public inquiry for landing page / non-authenticated users
export async function createPublicInquiry(req: Request, res: Response) {
  try {
    const data = publicInquirySchema.parse(req.body);
    const inquiry = await prisma.inquiry.create({
      data: {
        type: data.type,
        fromName: data.fromName,
        fromContact: data.fromContact,
        schoolName: data.schoolName,
        message: data.message,
        status: 'NEW',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Murojaatingiz qabul qilindi. Tez orada siz bilan bog\'lanamiz.',
      data: inquiry,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// ==========================================
// 8. SOZLAMALAR (SETTINGS)
// ==========================================

export async function getAdminSettings(_req: AuthRequest, res: Response) {
  try {
    const settings = await prisma.siteContent.findMany({
      where: { key: { startsWith: 'system.' } },
    });

    const defaultSettings = {
      notifications: {
        emailAlerts: true,
        smsAlerts: false,
        dailyReport: true,
      },
      aiLanguage: 'uz_latin' as const,
      security: {
        minPasswordLength: 8,
        sessionTimeout: 60,
        require2FA: false,
      },
      credentialFormula: '{schoolNumber}maktab{login}',
    };

    // Overlay saved settings
    for (const item of settings) {
      try {
        const field = item.key.replace('system.', '');
        if (field in defaultSettings) {
          (defaultSettings as any)[field] = JSON.parse(item.value);
        }
      } catch {}
    }

    return res.json({ success: true, data: defaultSettings });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateAdminSettings(req: AuthRequest, res: Response) {
  try {
    const { key, value } = siteContentUpdateSchema.parse(req.body);
    const systemKey = key.startsWith('system.') ? key : `system.${key}`;

    const updated = await prisma.siteContent.upsert({
      where: { key: systemKey },
      update: { value: typeof value === 'string' ? value : JSON.stringify(value) },
      create: { key: systemKey, value: typeof value === 'string' ? value : JSON.stringify(value) },
    });

    await logAdminAction(req.adminId || 'admin', 'SETTINGS_UPDATED', 'SiteContent', systemKey);

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// ==========================================
// 9. AUDIT LOGS
// ==========================================

export async function getAdminAuditLogs(req: AuthRequest, res: Response) {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return res.json({ success: true, data: logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
