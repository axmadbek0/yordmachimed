import { z } from 'zod';

export const superAdminLoginSchema = z.object({
  login: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(4, 'Parol kamida 4 belgidan iborat bo\'lishi kerak'),
}).refine((data) => Boolean(data.login || data.email), {
  message: 'Login yoki email kiritilishi shart',
  path: ['login'],
});

export const createSchoolSchema = z.object({
  name: z.string().min(2, 'Maktab nomi kiritilishi shart'),
  number: z.coerce.number().int().positive('Maktab raqami musbat butun son bo\'lishi kerak'),
  region: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  classCount: z.coerce.number().int().nonnegative().optional(),
  description: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  workingHours: z.string().optional(),
  foundedYear: z.coerce.number().int().optional(),
  isVerified: z.boolean().optional(),
  licenseNumber: z.string().optional(),
  ageRangeMin: z.coerce.number().int().optional(),
  ageRangeMax: z.coerce.number().int().optional(),
  photoUrls: z.array(z.string()).optional(),
  faqItems: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
});

export const updateSchoolSchema = createSchoolSchema.partial().extend({
  status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'active', 'pending', 'suspended']).optional(),
});

export const updateSchoolStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'active', 'pending', 'suspended']),
});

export const resetCredentialsSchema = z.object({
  role: z.enum(['teacher', 'school_admin', 'TEACHER', 'SCHOOL_ADMIN']).optional(),
});

export const updateInquirySchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'pending', 'replied']).optional(),
  adminReply: z.string().optional(),
});

export const publicInquirySchema = z.object({
  fromName: z.string().min(2, 'Ismingizni kiriting'),
  fromContact: z.string().min(5, 'Telefon yoki email kiriting'),
  schoolName: z.string().optional(),
  message: z.string().min(5, 'Murojaat matnini kiriting'),
  type: z.enum(['NEW_SCHOOL_REQUEST', 'SUPPORT', 'GENERAL']).default('GENERAL'),
});

export const siteContentUpdateSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export const recordPaymentSchema = z.object({
  userName: z.string().min(2),
  userRole: z.enum(['parent', 'teacher', 'school_admin']),
  userPhone: z.string().min(5),
  studentName: z.string().optional(),
  schoolNumber: z.coerce.number().optional(),
  planName: z.string().default('Standart'),
  amount: z.coerce.number().int().positive(),
  provider: z.string().default('Payme'),
  status: z.enum(['completed', 'pending', 'overdue', 'refunded']).default('completed'),
  expiryDate: z.string().optional(),
  cardNumberMasked: z.string().optional(),
});
