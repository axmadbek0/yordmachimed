import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 12);
  const admin71Hash = await bcrypt.hash('71maktabadmin', 12);

  console.log('Seeding database with Schools, Admins, Teachers, Students and Cameras...');

  // ==========================================
  // 0. Super Admin
  // ==========================================
  const superAdminHash = await bcrypt.hash('superadmin123', 12);
  await prisma.user.upsert({
    where: { login: 'admin@yordamchi.med' },
    update: {
      password_hash: superAdminHash,
      role: 'SUPER_ADMIN',
      full_name: 'Bosh Administrator',
      phone: '+998900000001',
      must_change_password: false,
    },
    create: {
      login: 'admin@yordamchi.med',
      password_hash: superAdminHash,
      role: 'SUPER_ADMIN',
      full_name: 'Bosh Administrator',
      phone: '+998900000001',
      must_change_password: false,
    },
  });

  await prisma.superAdmin.upsert({
    where: { login: 'admin@yordamchi.med' },
    update: {
      email: 'admin@yordamchi.med',
      passwordHash: superAdminHash,
      displayName: 'Bosh Administrator',
    },
    create: {
      login: 'admin@yordamchi.med',
      email: 'admin@yordamchi.med',
      passwordHash: superAdminHash,
      displayName: 'Bosh Administrator',
    },
  });

  // ==========================================
  // 1. 71-sonli Maktab-Internati
  // ==========================================
  const school71 = await prisma.school.upsert({
    where: { number: 71 },
    update: {
      name: '71-sonli Ixtisoslashtirilgan Maktab-Internati',
      address: 'Toshkent shahri, Chilonzor tumani, 9-mavze',
      region: 'Toshkent shahri',
      phone: '+998 71 277-71-71',
      description: "Alohida ta'lim ehtiyojlari bo'lgan bolalar uchun zamonaviy ijtimoiy-pedagogik reabilitatsiya va ta'lim markazi.",
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
        'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
      ]),
    },
    create: {
      number: 71,
      name: '71-sonli Ixtisoslashtirilgan Maktab-Internati',
      address: 'Toshkent shahri, Chilonzor tumani, 9-mavze',
      region: 'Toshkent shahri',
      phone: '+998 71 277-71-71',
      description: "Alohida ta'lim ehtiyojlari bo'lgan bolalar uchun zamonaviy ijtimoiy-pedagogik reabilitatsiya va ta'lim markazi.",
      photos: JSON.stringify([
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
        'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
      ]),
    },
  });

  // 71-Maktab Admini
  await prisma.user.upsert({
    where: { login: 'admin71' },
    update: {
      password_hash: passwordHash,
      role: 'SCHOOL_ADMIN',
      school_id: school71.id,
      full_name: 'Azamat Shokirov (71-Maktab Admini)',
      phone: '+998901237171',
      must_change_password: false,
    },
    create: {
      login: 'admin71',
      password_hash: passwordHash,
      role: 'SCHOOL_ADMIN',
      school_id: school71.id,
      full_name: 'Azamat Shokirov (71-Maktab Admini)',
      phone: '+998901237171',
      must_change_password: false,
    },
  });

  // 71-Maktab Kameralari
  await prisma.camera.deleteMany({ where: { school_id: school71.id } });
  await prisma.camera.createMany({
    data: [
      {
        school_id: school71.id,
        type: 'DORMITORY',
        sector_label: "1-Bino Yotoqxona (O'g'il bolalar 2-qavat)",
        stream_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
        is_active: true,
      },
      {
        school_id: school71.id,
        type: 'DORMITORY',
        sector_label: '2-Bino Yotoqxona (Qiz bolalar 1-qavat)',
        stream_url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80',
        is_active: true,
      },
      {
        school_id: school71.id,
        type: 'KITCHEN',
        sector_label: 'Asosiy Oshxona va Taom tarqatish zali',
        stream_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80',
        is_active: true,
      },
    ],
  });

  // 71-Maktab O'qituvchilari
  const teacher71_1 = await prisma.user.upsert({
    where: { login: 'umumi' },
    update: {
      password_hash: passwordHash,
      role: 'TEACHER',
      school_id: school71.id,
      full_name: 'Rustam Ahmedov',
      class_name: '4-A sinf',
      phone: '+998901112233',
    },
    create: {
      login: 'umumi',
      password_hash: passwordHash,
      role: 'TEACHER',
      school_id: school71.id,
      full_name: 'Rustam Ahmedov',
      class_name: '4-A sinf',
      phone: '+998901112233',
    },
  });

  const teacher71_2 = await prisma.user.upsert({
    where: { login: 'umumi2' },
    update: {
      password_hash: passwordHash,
      role: 'TEACHER',
      school_id: school71.id,
      full_name: 'Nodira Rahimova',
      class_name: '2-B sinf',
      phone: '+998902223344',
    },
    create: {
      login: 'umumi2',
      password_hash: passwordHash,
      role: 'TEACHER',
      school_id: school71.id,
      full_name: 'Nodira Rahimova',
      class_name: '2-B sinf',
      phone: '+998902223344',
    },
  });

  // 71-Maktab Ota-onalari
  const parent71_1 = await prisma.user.upsert({
    where: { login: '71_001' },
    update: {
      password_hash: passwordHash,
      role: 'PARENT',
      school_id: school71.id,
      full_name: 'Dilnoza Alimova (Ota-ona)',
      phone: '+998907100101',
    },
    create: {
      login: '71_001',
      password_hash: passwordHash,
      role: 'PARENT',
      school_id: school71.id,
      full_name: 'Dilnoza Alimova (Ota-ona)',
      phone: '+998907100101',
    },
  });

  const parent71_2 = await prisma.user.upsert({
    where: { login: '71_002' },
    update: {
      password_hash: passwordHash,
      role: 'PARENT',
      school_id: school71.id,
      full_name: 'Botir Saidov (Ota-ona)',
      phone: '+998907100202',
    },
    create: {
      login: '71_002',
      password_hash: passwordHash,
      role: 'PARENT',
      school_id: school71.id,
      full_name: 'Botir Saidov (Ota-ona)',
      phone: '+998907100202',
    },
  });

  // 71-Maktab O'quvchilari
  const std71_1 = await prisma.student.upsert({
    where: { id: 'std_71_1' },
    update: {
      first_name: 'Jasur',
      last_name: 'Alimov',
      class_name: '4-A sinf',
      diagnosis: 'Autizm spektri buzilishi (yengil)',
      school_id: school71.id,
      parent_id: parent71_1.id,
    },
    create: {
      id: 'std_71_1',
      first_name: 'Jasur',
      last_name: 'Alimov',
      class_name: '4-A sinf',
      diagnosis: 'Autizm spektri buzilishi (yengil)',
      school_id: school71.id,
      parent_id: parent71_1.id,
    },
  });

  const std71_2 = await prisma.student.upsert({
    where: { id: 'std_71_2' },
    update: {
      first_name: 'Rayhona',
      last_name: 'Saidova',
      class_name: '4-A sinf',
      diagnosis: 'Nutq rivojlanishida orqada qolish',
      school_id: school71.id,
      parent_id: parent71_2.id,
    },
    create: {
      id: 'std_71_2',
      first_name: 'Rayhona',
      last_name: 'Saidova',
      class_name: '4-A sinf',
      diagnosis: 'Nutq rivojlanishida orqada qolish',
      school_id: school71.id,
      parent_id: parent71_2.id,
    },
  });

  const std71_3 = await prisma.student.upsert({
    where: { id: 'std_71_3' },
    update: {
      first_name: 'Diyorbek',
      last_name: 'Qodirov',
      class_name: '2-B sinf',
      diagnosis: 'Giperaktivlik va diqqat yetishmovchiligi',
      school_id: school71.id,
    },
    create: {
      id: 'std_71_3',
      first_name: 'Diyorbek',
      last_name: 'Qodirov',
      class_name: '2-B sinf',
      diagnosis: 'Giperaktivlik va diqqat yetishmovchiligi',
      school_id: school71.id,
    },
  });

  // Kunlik holatlar
  await prisma.dailyLog.deleteMany({
    where: { student_id: { in: [std71_1.id, std71_2.id, std71_3.id] } },
  });

  await prisma.dailyLog.createMany({
    data: [
      {
        student_id: std71_1.id,
        mood: '🌟 Xursand',
        health: 'Sog‘lom',
        teacher_note: "Bugun rasm darsida akvarel bo'yoqlar bilan ajoyib manzara chizdi.",
        ai_analysis: '🌟 AI Pedagogik xulosa: Bolada ijodiy diqqat konsentratsiyasi yuqori darajada.',
      },
      {
        student_id: std71_2.id,
        mood: '🌤️ Tinch',
        health: 'Sog‘lom',
        teacher_note: "Logoped mashg'ulotida yangi tovushlarni muvaffaqiyatli takrorladi.",
        ai_analysis: '🌟 AI Pedagogik xulosa: Nutqiy faollik ijobiy dinamika ko‘rsatmoqda.',
      },
    ],
  });

  // Bildirishnomalar
  await prisma.announcement.deleteMany({ where: { school_id: school71.id } });
  await prisma.announcement.create({
    data: {
      school_id: school71.id,
      sender_id: teacher71_1.id,
      title: 'Ertangi bayram tadbiri haqida',
      body: 'Hurmatli ota-onalar! Ertaga soat 10:00 da maktab zalida ixtisoslashtirilgan ochiq dars bo‘lib o‘tadi.',
      type: 'announcement',
      target_classes: JSON.stringify(['4-A sinf']),
      delivered_count: 2,
    },
  });

  // Oshxona AI Tahlillari (71-Maktab)
  const kitchenCamera71 = await prisma.camera.findFirst({
    where: { school_id: school71.id, type: 'KITCHEN' },
  });

  if (kitchenCamera71) {
    await prisma.foodAnalysis.deleteMany({ where: { school_id: school71.id } });
    await prisma.foodAnalysis.create({
      data: {
        camera_id: kitchenCamera71.id,
        school_id: school71.id,
        frame_urls: JSON.stringify(['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80']),
        status: 'COMPLETED',
        detected_foods: JSON.stringify([
          { name: 'Sabzavotli yengil mastava sho‘rva', estimatedCalories: 180, category: 'sabzavot' },
          { name: 'Tovuq go‘shtli dimlama va grechka', estimatedCalories: 360, category: 'oqsil' },
          { name: 'Yangi bodring va ko‘katli salat', estimatedCalories: 45, category: 'sabzavot' },
          { name: 'Quritilgan o‘rik va olmali kompot', estimatedCalories: 75, category: 'ichimlik' },
        ]),
        total_calories: 660,
        health_score: 'BALANCED',
        ai_note: 'Bugungi tushlikda oqsil va vitaminlar mutanosibligi yuqori darajada ta\'minlangan. Taom bolalarning darsdan keyingi faolligi uchun to\'liq energiya bag\'ishlaydi.',
        captured_at: new Date(),
        analyzed_at: new Date(),
      },
    });

    await prisma.camera.update({
      where: { id: kitchenCamera71.id },
      data: {
        last_capture_at: new Date(),
        last_capture_status: 'SUCCESS',
      },
    });
  }

  // ==========================================
  // 2. 12-sonli Maktab
  // ==========================================
  const school12 = await prisma.school.upsert({
    where: { number: 12 },
    update: {
      name: '12-sonli Maxsus Maktab',
      address: 'Toshkent shahri, Yunusobod tumani',
      region: 'Toshkent shahri',
    },
    create: {
      number: 12,
      name: '12-sonli Maxsus Maktab',
      address: 'Toshkent shahri, Yunusobod tumani',
      region: 'Toshkent shahri',
    },
  });

  await prisma.user.upsert({
    where: { login: 'admin12' },
    update: {
      password_hash: passwordHash,
      role: 'SCHOOL_ADMIN',
      school_id: school12.id,
      full_name: '12-Maktab Admini',
    },
    create: {
      login: 'admin12',
      password_hash: passwordHash,
      role: 'SCHOOL_ADMIN',
      school_id: school12.id,
      full_name: '12-Maktab Admini',
    },
  });

  // ==========================================
  // Subscriptions, Inquiries, Payments, Settings
  // ==========================================
  await prisma.subscription.upsert({
    where: { schoolId: school71.id },
    update: {
      status: 'ACTIVE',
      plan: 'Professional',
      monthlyAmount: 2500000,
      nextBillingAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
    create: {
      schoolId: school71.id,
      status: 'ACTIVE',
      plan: 'Professional',
      monthlyAmount: 2500000,
      nextBillingAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.subscription.upsert({
    where: { schoolId: school12.id },
    update: {
      status: 'ACTIVE',
      plan: 'Standart',
      monthlyAmount: 1500000,
      nextBillingAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    create: {
      schoolId: school12.id,
      status: 'ACTIVE',
      plan: 'Standart',
      monthlyAmount: 1500000,
      nextBillingAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
  });

  // Sample inquiries
  const existingInquiry = await prisma.inquiry.findFirst();
  if (!existingInquiry) {
    await prisma.inquiry.createMany({
      data: [
        {
          type: 'NEW_SCHOOL_REQUEST',
          fromName: 'Rustam Karimov',
          fromContact: '+998901112233',
          schoolName: '24-sonli Ixtisoslashgan Maktab',
          message: 'Maktabimizni Yordamchi Med tizimiga ulash bo\'yicha shartnoma shartlarini bilmoqchi edik.',
          status: 'NEW',
        },
        {
          type: 'SUPPORT',
          fromName: 'Malika Karimova',
          fromContact: '+998935557788',
          schoolName: '71-sonli Maktab',
          message: 'Ota-onalar hisobotida AI tahlilini yuklashda sekinlashuv bo\'lyapti.',
          status: 'IN_PROGRESS',
        },
      ],
    });
  }

  // Sample payments
  const existingPayment = await prisma.userPayment.findFirst();
  if (!existingPayment) {
    await prisma.userPayment.createMany({
      data: [
        {
          transactionId: 'TXN-2026-0012',
          userName: 'Dilorom Rahimova',
          userRole: 'parent',
          userPhone: '+998901234567',
          studentName: 'Olimov Jasur',
          schoolNumber: 71,
          planName: 'Oylik obuna (Farzand monitoringi)',
          amount: 150000,
          provider: 'Payme',
          status: 'completed',
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cardNumberMasked: '8600 •••• •••• 4321',
        },
        {
          transactionId: 'TXN-2026-0013',
          userName: 'Alisher Qodirov',
          userRole: 'parent',
          userPhone: '+998912345678',
          studentName: 'Qodirova Madina',
          schoolNumber: 12,
          planName: 'Oylik obuna (Farzand monitoringi)',
          amount: 150000,
          provider: 'Click',
          status: 'completed',
          expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
          cardNumberMasked: '9860 •••• •••• 8765',
        },
      ],
    });
  }

  // Settings
  await prisma.siteContent.upsert({
    where: { key: 'system.credentialFormula' },
    update: { value: JSON.stringify('{schoolNumber}maktab{login}') },
    create: { key: 'system.credentialFormula', value: JSON.stringify('{schoolNumber}maktab{login}') },
  });

  console.log('Seed muvaffaqiyatli yakunlandi!');
  console.log({
    super_admin: { login: 'admin@yordamchi.med', password: 'superadmin123' },
    school71: { number: 71, name: school71.name },
    school71_admin: { login: 'admin71', role: 'SCHOOL_ADMIN', password: '123456' },
    school71_teacher: { login: 'umumi', password: '123456' },
    school71_parent: { login: '71_001', password: '123456' },
  });
}

main()
  .catch((error) => {
    console.error('Seed xatosi:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
