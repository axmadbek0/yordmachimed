/**
 * Super-Admin Mock Database
 * localStorage-based data store for admin panel
 */

import {
  School,
  Teacher,
  BillingRecord,
  UserPaymentRecord,
  PlatformStats,
  ActivityFeedItem,
  AttentionItem,
  MonthlyGrowthData,
  RegionData,
  TopSchoolData,
  AdminSettingsData,
  SchoolStatus,
} from '../types';
import { generateTeacherCredentials } from './generateCredentials';

// ==========================================
// Seed Data
// ==========================================

const REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand viloyati',
  "Farg'ona viloyati",
  'Buxoro viloyati',
  'Andijon viloyati',
  'Namangan viloyati',
  'Xorazm viloyati',
  'Surxondaryo viloyati',
  'Qashqadaryo viloyati',
  'Navoiy viloyati',
  'Jizzax viloyati',
  "Sirdaryo viloyati",
  "Qoraqalpog'iston Respublikasi",
];

const SEED_SCHOOLS: School[] = [
  {
    id: 'sch-1',
    number: 12,
    name: '12-sonli imkoniyati cheklangan bolalar uchun ixtisoslashtirilgan maktab-internati',
    region: 'Toshkent shahri',
    district: 'Chilonzor tumani',
    address: 'Toshkent sh., Chilonzor tumani, 3-mavze',
    phone: '+998 71 276 54 32',
    classCount: 8,
    status: 'active',
    teacherCount: 3,
    studentCount: 45,
    createdAt: '2025-09-01',
    lat: 41.2995,
    lng: 69.2401,
    description: 'Bizning maktab-internatimiz imkoniyati cheklangan bolalarga individual yondashuv asosida sifatli ta\'lim va tarbiya beradi. Tajribali pedagoglar va zamonaviy o\'quv usullari yordamida har bir o\'quvchi o\'z salohiyatini to\'liq namoyon qilishi uchun sharoit yaratilgan.',
    workingHours: 'Dushanba–Juma: 08:00–17:00',
    foundedYear: 1995,
    isVerified: true,
    licenseNumber: 'LIC-2023-TT-0012',
    ageRangeMin: 6,
    ageRangeMax: 18,
    faqItems: [
      { question: 'Qabul uchun qanday hujjatlar kerak?', answer: 'Tug\'ilganlik guvohnomasi, tibbiy ma\'lumotnoma (VKEK xulosasi), ota-ona pasporti nusxasi va 4 ta 3x4 fotosurat talab qilinadi.' },
      { question: 'Maktabda o\'qish pullikmi?', answer: 'Davlat tomonidan moliyalashtirilgan o\'rinlar mavjud. Qo\'shimcha to\'garak va individual darslar alohida narxda.' },
      { question: 'Bola maktabda kechasi qolishi mumkinmi?', answer: 'Ha, maktabimizda yotoqxona bo\'lib, bolalar hafta davomida qolishlari mumkin. Dam olish kunlari ota-onalarga beriladi.' },
    ],
  },
  {
    id: 'sch-2',
    number: 45,
    name: '45-sonli aqli zaif bolalar uchun maktab-internati',
    region: 'Samarqand viloyati',
    district: 'Samarqand tumani',
    address: "Samarqand sh., Gagarin ko'chasi, 12",
    phone: '+998 66 233 44 55',
    classCount: 6,
    status: 'active',
    teacherCount: 2,
    studentCount: 32,
    createdAt: '2025-10-15',
    lat: 39.6542,
    lng: 66.9597,
    description: 'Samarqand viloyatining yetakchi maxsus ta\'lim muassasasi. Aqliy rivojlanishida qiyinchiliklari bor bolalarga moslashtirilgan ta\'lim dasturlari, nutq terapiyasi va mehnat ta\'limi mashg\'ulotlari olib boriladi.',
    workingHours: 'Dushanba–Shanba: 08:30–17:30',
    foundedYear: 2001,
    isVerified: true,
    licenseNumber: 'LIC-2022-SM-0045',
    ageRangeMin: 7,
    ageRangeMax: 17,
    faqItems: [
      { question: 'Maktabga qanday murojaat qilsa bo\'ladi?', answer: 'To\'g\'ridan-to\'g\'ri maktab ma\'muriyatiga tashrif buyuring yoki telefon orqali dastlabki ko\'rikka yoziling.' },
      { question: 'Qanday mutaxassislar ishlaydi?', answer: 'Defektolog, logoped, psixolog, maxsus pedagog va jismoniy tarbiya mutaxassislari xizmat ko\'rsatadi.' },
    ],
  },
  {
    id: 'sch-3',
    number: 3,
    name: '3-sonli Daun sindromli bolalar ixtisoslashtirilgan maktabi',
    region: "Farg'ona viloyati",
    district: "Farg'ona tumani",
    address: "Farg'ona sh., Al-Fargoniy ko'chasi, 88",
    phone: '+998 73 244 55 66',
    classCount: 5,
    status: 'active',
    teacherCount: 2,
    studentCount: 28,
    createdAt: '2025-11-20',
    lat: 40.3864,
    lng: 71.7864,
    description: 'Daun sindromi va boshqa xromosoma kasalliklari bo\'lgan bolalarga ixtisoslashgan respublika miqyosidagi yetakchi maktab. Har bir bola uchun yakka tartibdagi ta\'lim rejasi tuziladi.',
    workingHours: 'Dushanba–Juma: 09:00–16:00',
    foundedYear: 2008,
    isVerified: true,
    ageRangeMin: 5,
    ageRangeMax: 18,
    faqItems: [
      { question: 'Maktabga nechinchi yoshdan qabul qilinadi?', answer: '5 yoshdan boshlab erta intervensiya dasturlari, 7 yoshdan esa to\'liq ta\'lim dasturi mavjud.' },
      { question: 'Transport xizmati bormi?', answer: 'Shahar ichida maxsus avtobus xizmati yo\'lga qo\'yilgan. Tafsilotlar uchun maktab bilan bog\'laning.' },
    ],
  },
  {
    id: 'sch-4',
    number: 71,
    name: '71-sonli maxsus ta\'lim maktab-internati',
    region: 'Buxoro viloyati',
    district: 'Buxoro tumani',
    address: "Buxoro sh., Navoiy ko'chasi, 5",
    phone: '+998 65 221 33 44',
    classCount: 4,
    status: 'pending',
    teacherCount: 0,
    studentCount: 0,
    createdAt: '2026-06-10',
    lat: 39.7747,
    lng: 64.4286,
    description: 'Buxoro viloyatida yangi ochilayotgan maxsus ta\'lim muassasasi. Yaqin orada to\'liq faoliyat boshlaydi.',
    workingHours: 'Ma\'lumot mavjud emas',
    foundedYear: 2026,
    isVerified: false,
    ageRangeMin: 6,
    ageRangeMax: 18,
  },
  {
    id: 'sch-5',
    number: 18,
    name: '18-sonli maxsus ta\'lim maktab-internati',
    region: 'Andijon viloyati',
    district: 'Andijon tumani',
    address: "Andijon sh., Bobur ko'chasi, 22",
    phone: '+998 74 223 11 22',
    classCount: 7,
    status: 'active',
    teacherCount: 3,
    studentCount: 38,
    createdAt: '2026-01-15',
    lat: 40.7821,
    lng: 72.3441,
    description: 'Andijon viloyatining eng yirik maxsus ta\'lim maktab-internati. Kognitiv va jismoniy rivojlanish qiyinchiliklari bo\'lgan bolalarga kompleks yordam ko\'rsatiladi.',
    workingHours: 'Dushanba–Juma: 08:00–18:00',
    foundedYear: 2004,
    isVerified: true,
    licenseNumber: 'LIC-2021-AND-0018',
    ageRangeMin: 6,
    ageRangeMax: 18,
    faqItems: [
      { question: 'Qanday dasturlar mavjud?', answer: 'Erta intervensiya, maktabgacha ta\'lim, umumiy o\'rta ta\'lim va mehnat ta\'limi dasturlari amalga oshiriladi.' },
    ],
  },
  {
    id: 'sch-6',
    number: 9,
    name: "9-sonli bolalar rivojlanish markazi",
    region: 'Namangan viloyati',
    district: 'Namangan tumani',
    address: "Namangan sh., Mustaqillik ko'chasi, 15",
    phone: '+998 69 227 88 99',
    classCount: 3,
    status: 'suspended',
    teacherCount: 1,
    studentCount: 12,
    createdAt: '2025-12-05',
    lat: 41.0011,
    lng: 71.6725,
    description: 'Namangan shahrida joylashgan rivojlanish markazi. Hozirda texnik sabablarga ko\'ra faoliyati vaqtincha to\'xtatilgan.',
    workingHours: 'Vaqtincha to\'xtatilgan',
    foundedYear: 2010,
    isVerified: false,
  },
];

const SEED_TEACHERS: Teacher[] = [
  // Maktab 12
  {
    id: 'tch-1',
    fullName: 'Abdullayeva Nodira',
    login: 'umumi',
    password: '12maktabumumi',
    schoolId: 'sch-1',
    schoolNumber: 12,
    schoolName: '12-sonli maktab-internat',
    lastActivity: '2026-07-22T10:30:00',
    status: 'active',
    role: 'teacher',
  },
  {
    id: 'tch-2',
    fullName: 'Karimov Jasur',
    login: 'umumi2',
    password: '12maktabumumi2',
    schoolId: 'sch-1',
    schoolNumber: 12,
    schoolName: '12-sonli maktab-internat',
    lastActivity: '2026-07-21T14:15:00',
    status: 'active',
    role: 'school_admin',
  },
  {
    id: 'tch-3',
    fullName: 'Rahimova Malika',
    login: 'umumi3',
    password: '12maktabumumi3',
    schoolId: 'sch-1',
    schoolNumber: 12,
    schoolName: '12-sonli maktab-internat',
    lastActivity: '2026-07-20T09:00:00',
    status: 'active',
    role: 'teacher',
  },
  // Maktab 45
  {
    id: 'tch-4',
    fullName: 'Toshmatov Bobur',
    login: 'umumi',
    password: '45maktabumumi',
    schoolId: 'sch-2',
    schoolNumber: 45,
    schoolName: '45-sonli maktab-internat',
    lastActivity: '2026-07-22T08:45:00',
    status: 'active',
    role: 'teacher',
  },
  {
    id: 'tch-5',
    fullName: "Qo'chqarova Dilnoza",
    login: 'umumi2',
    password: '45maktabumumi2',
    schoolId: 'sch-2',
    schoolNumber: 45,
    schoolName: '45-sonli maktab-internat',
    lastActivity: '2026-07-19T16:30:00',
    status: 'active',
    role: 'teacher',
  },
  // Maktab 3
  {
    id: 'tch-6',
    fullName: 'Ergasheva Shahlo',
    login: 'umumi',
    password: '3maktabumumi',
    schoolId: 'sch-3',
    schoolNumber: 3,
    schoolName: "3-sonli ixtisoslashtirilgan maktab",
    lastActivity: '2026-07-22T11:00:00',
    status: 'active',
    role: 'teacher',
  },
  {
    id: 'tch-7',
    fullName: 'Hasanov Sardor',
    login: 'umumi2',
    password: '3maktabumumi2',
    schoolId: 'sch-3',
    schoolNumber: 3,
    schoolName: "3-sonli ixtisoslashtirilgan maktab",
    lastActivity: '2026-07-18T13:20:00',
    status: 'blocked',
    role: 'teacher',
  },
  // Maktab 18
  {
    id: 'tch-8',
    fullName: 'Mirzayev Ulug\'bek',
    login: 'umumi',
    password: '18maktabumumi',
    schoolId: 'sch-5',
    schoolNumber: 18,
    schoolName: "18-sonli maktab-internat",
    lastActivity: '2026-07-22T09:15:00',
    status: 'active',
    role: 'teacher',
  },
  {
    id: 'tch-9',
    fullName: 'Normatova Barno',
    login: 'umumi2',
    password: '18maktabumumi2',
    schoolId: 'sch-5',
    schoolNumber: 18,
    schoolName: "18-sonli maktab-internat",
    lastActivity: '2026-07-21T10:00:00',
    status: 'active',
    role: 'school_admin',
  },
  {
    id: 'tch-10',
    fullName: 'Xolmatov Alisher',
    login: 'umumi3',
    password: '18maktabumumi3',
    schoolId: 'sch-5',
    schoolNumber: 18,
    schoolName: "18-sonli maktab-internat",
    lastActivity: '2026-07-15T14:30:00',
    status: 'active',
    role: 'teacher',
  },
  // Maktab 9
  {
    id: 'tch-11',
    fullName: 'Yusupova Kamola',
    login: 'umumi',
    password: '9maktabumumi',
    schoolId: 'sch-6',
    schoolNumber: 9,
    schoolName: "9-sonli rivojlanish markazi",
    lastActivity: '2026-06-01T12:00:00',
    status: 'blocked',
    role: 'teacher',
  },
];

const SEED_BILLING: BillingRecord[] = [
  {
    id: 'bill-1',
    schoolId: 'sch-1',
    schoolNumber: 12,
    schoolName: '12-sonli maktab-internat',
    status: 'active',
    nextPayment: '2026-08-01',
    amount: 500000,
    plan: 'Premium',
  },
  {
    id: 'bill-2',
    schoolId: 'sch-2',
    schoolNumber: 45,
    schoolName: '45-sonli maktab-internat',
    status: 'active',
    nextPayment: '2026-08-15',
    amount: 350000,
    plan: 'Standart',
  },
  {
    id: 'bill-3',
    schoolId: 'sch-3',
    schoolNumber: 3,
    schoolName: "3-sonli ixtisoslashtirilgan maktab",
    status: 'overdue',
    nextPayment: '2026-07-01',
    amount: 350000,
    plan: 'Standart',
  },
  {
    id: 'bill-4',
    schoolId: 'sch-5',
    schoolNumber: 18,
    schoolName: "18-sonli maktab-internat",
    status: 'active',
    nextPayment: '2026-09-01',
    amount: 500000,
    plan: 'Premium',
  },
  {
    id: 'bill-5',
    schoolId: 'sch-6',
    schoolNumber: 9,
    schoolName: "9-sonli rivojlanish markazi",
    status: 'cancelled',
    nextPayment: '2026-06-01',
    amount: 200000,
    plan: 'Boshlang\'ich',
  },
  {
    id: 'bill-6',
    schoolId: 'sch-4',
    schoolNumber: 71,
    schoolName: "71-sonli maktab-internat",
    status: 'overdue',
    nextPayment: '2026-07-10',
    amount: 350000,
    plan: 'Standart',
  },
];

const SEED_USER_PAYMENTS: UserPaymentRecord[] = [
  {
    id: 'upay-1',
    transactionId: 'TRX-982410',
    userName: 'Dilshoda Karimova',
    userRole: 'parent',
    userPhone: '+998 90 123 45 67',
    studentName: 'Jasur Karimov (3-A)',
    schoolNumber: 12,
    planName: 'Ota-ona Premium (AI Maslahatchi + Oylik Tahlil)',
    amount: 89000,
    provider: 'Click',
    status: 'completed',
    paymentDate: '2026-07-22T09:14:00',
    expiryDate: '2026-08-22',
    cardNumberMasked: '8600 **** **** 4892',
  },
  {
    id: 'upay-2',
    transactionId: 'TRX-982411',
    userName: 'Otabek Mirzayev',
    userRole: 'parent',
    userPhone: '+998 93 456 78 90',
    studentName: 'Malika Mirzayeva (5-B)',
    schoolNumber: 45,
    planName: 'Individual AI Psixologik Yordam',
    amount: 120000,
    provider: 'Payme',
    status: 'completed',
    paymentDate: '2026-07-21T18:30:00',
    expiryDate: '2026-08-21',
    cardNumberMasked: '9860 **** **** 1204',
  },
  {
    id: 'upay-3',
    transactionId: 'TRX-982412',
    userName: 'Nargiza Axmedova',
    userRole: 'parent',
    userPhone: '+998 97 888 11 22',
    studentName: 'Sardor Axmedov (2-A)',
    schoolNumber: 3,
    planName: 'Ota-ona Standart Obuna',
    amount: 49000,
    provider: 'Uzum Pay',
    status: 'overdue',
    paymentDate: '2026-06-15T10:20:00',
    expiryDate: '2026-07-15',
    cardNumberMasked: '8600 **** **** 9931',
  },
  {
    id: 'upay-4',
    transactionId: 'TRX-982413',
    userName: 'Rustam Qosimov',
    userRole: 'parent',
    userPhone: '+998 91 333 44 55',
    studentName: 'Madina Qosimova (4-B)',
    schoolNumber: 18,
    planName: 'Pedagogik Rivojlantiruvchi Paket',
    amount: 150000,
    provider: 'Click',
    status: 'completed',
    paymentDate: '2026-07-20T14:45:00',
    expiryDate: '2026-08-20',
    cardNumberMasked: '8600 **** **** 7712',
  },
  {
    id: 'upay-5',
    transactionId: 'TRX-982414',
    userName: 'Feruza Rashidova',
    userRole: 'parent',
    userPhone: '+998 94 666 77 88',
    studentName: 'Azizbek Rashidov (1-A)',
    schoolNumber: 12,
    planName: 'Ota-ona Standart Obuna',
    amount: 49000,
    provider: 'Karta (Uzcard/Humo)',
    status: 'pending',
    paymentDate: '2026-07-22T12:05:00',
    expiryDate: '2026-08-22',
    cardNumberMasked: '5614 **** **** 3320',
  },
  {
    id: 'upay-6',
    transactionId: 'TRX-982415',
    userName: 'Ulug\'bek Tursunov',
    userRole: 'teacher',
    userPhone: '+998 95 111 22 33',
    schoolNumber: 18,
    planName: 'O\'qituvchi Pro (Master AI Metodika)',
    amount: 199000,
    provider: 'Payme',
    status: 'completed',
    paymentDate: '2026-07-19T11:00:00',
    expiryDate: '2026-08-19',
    cardNumberMasked: '9860 **** **** 5541',
  },
  {
    id: 'upay-7',
    transactionId: 'TRX-982416',
    userName: 'Shahnoza Umarova',
    userRole: 'parent',
    userPhone: '+998 99 777 99 00',
    studentName: 'Amir Umarov (6-A)',
    schoolNumber: 45,
    planName: 'Ota-ona Premium (AI Maslahatchi + Oylik Tahlil)',
    amount: 89000,
    provider: 'Click',
    status: 'refunded',
    paymentDate: '2026-07-18T16:10:00',
    expiryDate: '2026-07-19',
    cardNumberMasked: '8600 **** **** 2291',
  },
];

const SEED_ACTIVITY: ActivityFeedItem[] = [
  { id: 'act-1', message: "71-maktab yangi so'rov yubordi", timestamp: '2026-07-22T09:30:00', type: 'school' },
  { id: 'act-2', message: "12-maktab yangi o'qituvchi qo'shdi", timestamp: '2026-07-22T08:15:00', type: 'teacher' },
  { id: 'act-3', message: "45-maktab obunani yangiladi", timestamp: '2026-07-21T16:45:00', type: 'billing' },
  { id: 'act-4', message: "18-maktab 5 ta yangi o'quvchi ro'yxatdan o'tkazdi", timestamp: '2026-07-21T14:20:00', type: 'school' },
  { id: 'act-5', message: "3-maktab to'lov muddati o'tdi", timestamp: '2026-07-21T10:00:00', type: 'billing' },
  { id: 'act-6', message: "9-maktab to'xtatildi (obuna bekor qilingan)", timestamp: '2026-07-20T11:30:00', type: 'system' },
  { id: 'act-7', message: "12-maktab AI chatbot 24 ta suhbat yuritdi", timestamp: '2026-07-20T09:00:00', type: 'system' },
  { id: 'act-8', message: "Andijon viloyatidan 18-maktab qo'shildi", timestamp: '2026-07-19T15:00:00', type: 'school' },
];

// ==========================================
// localStorage Helpers
// ==========================================

const KEYS = {
  schools: 'yordamchi_admin_schools',
  teachers: 'yordamchi_admin_teachers',
  billing: 'yordamchi_admin_billing',
  userPayments: 'yordamchi_admin_user_payments',
  settings: 'yordamchi_admin_settings',
};

function initAdminDB() {
  if (!localStorage.getItem(KEYS.schools)) {
    localStorage.setItem(KEYS.schools, JSON.stringify(SEED_SCHOOLS));
  }
  if (!localStorage.getItem(KEYS.teachers)) {
    localStorage.setItem(KEYS.teachers, JSON.stringify(SEED_TEACHERS));
  }
  if (!localStorage.getItem(KEYS.billing)) {
    localStorage.setItem(KEYS.billing, JSON.stringify(SEED_BILLING));
  }
  if (!localStorage.getItem(KEYS.userPayments)) {
    localStorage.setItem(KEYS.userPayments, JSON.stringify(SEED_USER_PAYMENTS));
  }

  // Auto-sync with backend in background if token exists
  if (typeof window !== 'undefined' && localStorage.getItem('yordamchi_admin_token')) {
    syncAdminWithBackend();
  }
}

function getAdminHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('yordamchi_admin_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

let isSyncing = false;
export async function syncAdminWithBackend() {
  if (isSyncing || typeof window === 'undefined') return;
  const token = localStorage.getItem('yordamchi_admin_token');
  if (!token) return;

  isSyncing = true;
  try {
    const [schoolsRes, usersRes, billingRes, settingsRes] = await Promise.all([
      fetch('/api/admin/schools', { headers: getAdminHeaders() }),
      fetch('/api/admin/users', { headers: getAdminHeaders() }),
      fetch('/api/admin/billing', { headers: getAdminHeaders() }),
      fetch('/api/admin/settings', { headers: getAdminHeaders() }),
    ]);

    if (schoolsRes.ok) {
      const json = await schoolsRes.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        localStorage.setItem(KEYS.schools, JSON.stringify(json.data));
      }
    }
    if (usersRes.ok) {
      const json = await usersRes.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        localStorage.setItem(KEYS.teachers, JSON.stringify(json.data));
      }
    }
    if (billingRes.ok) {
      const json = await billingRes.json();
      if (json.success && json.data) {
        if (Array.isArray(json.data.subscriptions) && json.data.subscriptions.length > 0) {
          localStorage.setItem(KEYS.billing, JSON.stringify(json.data.subscriptions));
        }
        if (Array.isArray(json.data.userPayments) && json.data.userPayments.length > 0) {
          localStorage.setItem(KEYS.userPayments, JSON.stringify(json.data.userPayments));
        }
      }
    }
    if (settingsRes.ok) {
      const json = await settingsRes.json();
      if (json.success && json.data) {
        localStorage.setItem(KEYS.settings, JSON.stringify(json.data));
      }
    }
  } catch (err) {
    console.warn('syncAdminWithBackend error:', err);
  } finally {
    isSyncing = false;
  }
}


// ==========================================
// Schools CRUD
// ==========================================

export function getSchools(): School[] {
  initAdminDB();
  return JSON.parse(localStorage.getItem(KEYS.schools) || '[]');
}

export function getSchoolById(id: string): School | undefined {
  return getSchools().find((s) => s.id === id);
}

export function isSchoolNumberTaken(number: number): boolean {
  return getSchools().some((s) => s.number === number);
}

export function addSchool(school: Omit<School, 'id' | 'createdAt' | 'teacherCount' | 'studentCount' | 'status'>): {
  school: School;
  teacherLogin: string;
  teacherPassword: string;
} {
  const schools = getSchools();
  const newSchool: School = {
    ...school,
    id: `sch-${Date.now()}`,
    status: 'active',
    teacherCount: 1,
    studentCount: 0,
    createdAt: new Date().toISOString().split('T')[0],
  };
  schools.push(newSchool);
  localStorage.setItem(KEYS.schools, JSON.stringify(schools));

  // Generate first teacher credentials
  const creds = generateTeacherCredentials(school.number, 1);

  // Add teacher record
  const teachers = getTeachers();
  const newTeacher: Teacher = {
    id: `tch-${Date.now()}`,
    fullName: `Asosiy o'qituvchi`,
    login: creds.login,
    password: creds.password,
    schoolId: newSchool.id,
    schoolNumber: school.number,
    schoolName: school.name,
    lastActivity: new Date().toISOString(),
    status: 'active',
    role: 'teacher',
  };
  teachers.push(newTeacher);
  localStorage.setItem(KEYS.teachers, JSON.stringify(teachers));

  // Dispatch async creation to backend
  if (typeof window !== 'undefined') {
    fetch('/api/admin/schools', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(school),
    }).then(async (res) => {
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.school) {
          // Update id from real DB if available
          const currentSchools = getSchools();
          const found = currentSchools.find((s) => s.number === school.number);
          if (found) {
            found.id = json.data.school.id;
            localStorage.setItem(KEYS.schools, JSON.stringify(currentSchools));
          }
        }
      }
    }).catch(console.warn);
  }

  return {
    school: newSchool,
    teacherLogin: creds.login,
    teacherPassword: creds.password,
  };
}

export function updateSchool(id: string, updates: Partial<School>): School | undefined {
  const schools = getSchools();
  const idx = schools.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  schools[idx] = { ...schools[idx], ...updates };
  localStorage.setItem(KEYS.schools, JSON.stringify(schools));

  // Sync update to backend
  if (typeof window !== 'undefined') {
    fetch(`/api/admin/schools/${id}`, {
      method: 'PATCH',
      headers: getAdminHeaders(),
      body: JSON.stringify(updates),
    }).catch(console.warn);
  }

  return schools[idx];
}

export function deactivateSchool(id: string): boolean {
  const school = updateSchool(id, { status: 'suspended' as SchoolStatus });
  if (school) {
    // Block all teachers of this school
    const teachers = getTeachers();
    teachers.forEach((t) => {
      if (t.schoolId === id) t.status = 'blocked';
    });
    localStorage.setItem(KEYS.teachers, JSON.stringify(teachers));

    // Sync status change to backend
    if (typeof window !== 'undefined') {
      fetch(`/api/admin/schools/${id}/status`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: 'SUSPENDED' }),
      }).catch(console.warn);
    }

    return true;
  }
  return false;
}

// ==========================================
// Teachers CRUD
// ==========================================

export function getTeachers(): Teacher[] {
  initAdminDB();
  return JSON.parse(localStorage.getItem(KEYS.teachers) || '[]');
}

export function getTeachersBySchool(schoolId: string): Teacher[] {
  return getTeachers().filter((t) => t.schoolId === schoolId);
}

export function toggleTeacherStatus(id: string): Teacher | undefined {
  const teachers = getTeachers();
  const idx = teachers.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  teachers[idx].status = teachers[idx].status === 'active' ? 'blocked' : 'active';
  localStorage.setItem(KEYS.teachers, JSON.stringify(teachers));

  // Sync to backend
  if (typeof window !== 'undefined') {
    fetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: getAdminHeaders(),
    }).catch(console.warn);
  }

  return teachers[idx];
}

export function resetTeacherCredentials(id: string): { login: string; password: string } | undefined {
  const teachers = getTeachers();
  const teacher = teachers.find((t) => t.id === id);
  if (!teacher) return undefined;

  // Sync reset to backend
  if (typeof window !== 'undefined') {
    fetch(`/api/admin/users/${id}/reset-credentials`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ role: teacher.role || 'teacher' }),
    }).catch(console.warn);
  }

  return { login: teacher.login, password: teacher.password };
}

// ==========================================
// Billing
// ==========================================

export function getBillingRecords(): BillingRecord[] {
  initAdminDB();
  return JSON.parse(localStorage.getItem(KEYS.billing) || '[]');
}

export function getUserPayments(): UserPaymentRecord[] {
  initAdminDB();
  return JSON.parse(localStorage.getItem(KEYS.userPayments) || '[]');
}

export function addUserPayment(payment: Omit<UserPaymentRecord, 'id' | 'transactionId' | 'paymentDate'>): UserPaymentRecord {
  const payments = getUserPayments();
  const newPayment: UserPaymentRecord = {
    ...payment,
    id: `upay-${Date.now()}`,
    transactionId: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
    paymentDate: new Date().toISOString(),
  };
  payments.unshift(newPayment);
  localStorage.setItem(KEYS.userPayments, JSON.stringify(payments));
  return newPayment;
}

export function updateUserPaymentStatus(id: string, status: UserPaymentRecord['status']): UserPaymentRecord | undefined {
  const payments = getUserPayments();
  const idx = payments.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  payments[idx].status = status;
  localStorage.setItem(KEYS.userPayments, JSON.stringify(payments));
  return payments[idx];
}


// ==========================================
// Platform Stats
// ==========================================

export function getPlatformStats(): PlatformStats {
  const schools = getSchools();
  const teachers = getTeachers();
  if (schools.length === 0) {
    return {
      totalSchools: 0,
      totalTeachers: 0,
      totalStudents: 0,
      activeChatsToday: 0,
      schoolsTrend: 0,
      teachersTrend: 0,
      studentsTrend: 0,
      chatsTrend: 0,
    };
  }
  return {
    totalSchools: schools.length,
    totalTeachers: teachers.filter((t) => t.status === 'active').length,
    totalStudents: schools.reduce((sum, s) => sum + s.studentCount, 0),
    activeChatsToday: 47,
    schoolsTrend: 12,
    teachersTrend: 8,
    studentsTrend: 15,
    chatsTrend: 23,
  };
}

// ==========================================
// Activity Feed
// ==========================================

export function getActivityFeed(): ActivityFeedItem[] {
  const schools = getSchools();
  if (schools.length === 0) {
    return [];
  }
  return [...SEED_ACTIVITY].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// ==========================================
// Attention Items
// ==========================================

export function getAttentionItems(): AttentionItem[] {
  const schools = getSchools();
  const billing = getBillingRecords();
  const items: AttentionItem[] = [];

  const pendingSchools = schools.filter((s) => s.status === 'pending');
  if (pendingSchools.length > 0) {
    items.push({
      id: 'attn-1',
      message: `${pendingSchools.length} ta maktab so'rovi kutilmoqda`,
      type: 'pending_school',
      link: '/admin/schools',
    });
  }

  const overduePayments = billing.filter((b) => b.status === 'overdue');
  if (overduePayments.length > 0) {
    items.push({
      id: 'attn-2',
      message: `${overduePayments.length} ta to'lov muddati o'tgan`,
      type: 'overdue_payment',
      link: '/admin/billing',
    });
  }

  return items;
}

// ==========================================
// Analytics Data
// ==========================================

export function getMonthlyGrowthData(): MonthlyGrowthData[] {
  const schools = getSchools();
  if (schools.length === 0) {
    return [];
  }
  return [
    { month: 'Yan', schools: 1, students: 15, teachers: 2 },
    { month: 'Fev', schools: 1, students: 22, teachers: 3 },
    { month: 'Mar', schools: 2, students: 38, teachers: 5 },
    { month: 'Apr', schools: 2, students: 52, teachers: 6 },
    { month: 'May', schools: 3, students: 75, teachers: 8 },
    { month: 'Iyun', schools: 4, students: 98, teachers: 9 },
    { month: 'Iyul', schools: 5, students: 120, teachers: 11 },
    { month: 'Avg', schools: 5, students: 135, teachers: 11 },
    { month: 'Sen', schools: 6, students: 155, teachers: 13 },
    { month: 'Okt', schools: 6, students: 155, teachers: 13 },
    { month: 'Noy', schools: 6, students: 155, teachers: 13 },
    { month: 'Dek', schools: 6, students: 155, teachers: 13 },
  ];
}

export function getRegionData(): RegionData[] {
  const schools = getSchools();
  if (schools.length === 0) {
    return [];
  }
  return [
    { region: 'Toshkent shahri', count: 45, color: '#1B6FA8' },
    { region: 'Samarqand', count: 32, color: '#E8734A' },
    { region: "Farg'ona", count: 28, color: '#123C5C' },
    { region: 'Andijon', count: 38, color: '#51728C' },
    { region: 'Buxoro', count: 0, color: '#D3E6F5' },
    { region: 'Namangan', count: 12, color: '#16324A' },
  ];
}

export function getTopSchools(): TopSchoolData[] {
  const schools = getSchools();
  if (schools.length === 0) {
    return [];
  }
  return [
    { id: 'sch-1', name: '12-sonli maktab-internat', number: 12, score: 92, studentCount: 45 },
    { id: 'sch-5', name: "18-sonli maktab-internat", number: 18, score: 87, studentCount: 38 },
    { id: 'sch-2', name: '45-sonli maktab-internat', number: 45, score: 81, studentCount: 32 },
    { id: 'sch-3', name: "3-sonli maktab", number: 3, score: 76, studentCount: 28 },
    { id: 'sch-6', name: "9-sonli rivojlanish markazi", number: 9, score: 45, studentCount: 12 },
  ];
}

export function getWellbeingTrendData(): { month: string; score: number }[] {
  const schools = getSchools();
  if (schools.length === 0) {
    return [];
  }
  return [
    { month: 'Yan', score: 72 },
    { month: 'Fev', score: 74 },
    { month: 'Mar', score: 71 },
    { month: 'Apr', score: 78 },
    { month: 'May', score: 80 },
    { month: 'Iyun', score: 82 },
    { month: 'Iyul', score: 79 },
    { month: 'Avg', score: 83 },
    { month: 'Sen', score: 85 },
    { month: 'Okt', score: 84 },
    { month: 'Noy', score: 86 },
    { month: 'Dek', score: 88 },
  ];
}

// ==========================================
// Admin Settings
// ==========================================

export function getAdminSettings(): AdminSettingsData {
  const stored = localStorage.getItem(KEYS.settings);
  if (stored) return JSON.parse(stored);
  return {
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      dailyReport: true,
    },
    aiLanguage: 'uz_latin',
    security: {
      minPasswordLength: 8,
      sessionTimeout: 60,
      require2FA: false,
    },
    credentialFormula: '{maktab_raqami}maktab{login}',
  };
}

export function saveAdminSettings(settings: AdminSettingsData): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));

  // Sync settings to backend
  if (typeof window !== 'undefined') {
    fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: getAdminHeaders(),
      body: JSON.stringify({ key: 'system.settings', value: JSON.stringify(settings) }),
    }).catch(console.warn);
  }
}
