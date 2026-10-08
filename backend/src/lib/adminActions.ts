import bcrypt from 'bcrypt';
import { prisma } from './prisma';

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: object | string
) {
  try {
    const metaString = metadata
      ? typeof metadata === 'string'
        ? metadata
        : JSON.stringify(metadata)
      : null;

    return await prisma.auditLog.create({
      data: {
        adminId: adminId || 'system',
        action,
        targetType,
        targetId,
        metadata: metaString,
      },
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}

export async function createFirstTeacherForSchool(schoolId: string, schoolNumber: number) {
  const login = 'umumi';
  const password = `${schoolNumber}maktab${login}`;
  const passwordHash = await bcrypt.hash(password, 12);

  const teacher = await prisma.user.create({
    data: {
      school_id: schoolId,
      login: `${schoolNumber}_${login}`,
      password_hash: passwordHash,
      full_name: 'Asosiy o\'qituvchi',
      role: 'TEACHER',
      must_change_password: true,
      status: 'active',
    },
  });

  return {
    id: teacher.id,
    login: teacher.login,
    password, // Return raw password ONLY once upon creation
  };
}

export async function resetUserCredentials(userId: string, role?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true },
  });

  if (!user) return null;

  const schoolNumber = user.school?.number || 0;
  const newPassword = `${schoolNumber}maktab${user.login.replace(/^.*_/, '')}`;
  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password_hash: passwordHash,
      must_change_password: true,
      status: 'active',
    },
  });

  return {
    login: user.login,
    password: newPassword,
  };
}

export async function computePlatformAnalytics(period: string = 'month') {
  const [schools, teachers, students, payments, subscriptions] = await Promise.all([
    prisma.school.findMany({
      include: {
        _count: { select: { users: true, students: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ['TEACHER', 'SCHOOL_ADMIN'] } },
      include: { school: { select: { name: true, number: true } } },
    }),
    prisma.student.findMany(),
    prisma.userPayment.findMany({ orderBy: { paymentDate: 'desc' } }),
    prisma.subscription.findMany(),
  ]);

  // Group schools by region
  const regionMap: Record<string, number> = {};
  for (const s of schools) {
    const reg = s.region || 'Noma\'lum';
    regionMap[reg] = (regionMap[reg] || 0) + 1;
  }

  const regionData = Object.entries(regionMap).map(([region, count], index) => {
    const colors = ['#2563eb', '#38bdf8', '#4f46e5', '#818cf8', '#0ea5e9', '#6366f1', '#0284c7', '#a855f7'];
    return {
      region,
      count,
      color: colors[index % colors.length],
    };
  });

  // Top schools by studentCount
  const topSchools = schools
    .map((s) => ({
      id: s.id,
      name: s.name,
      number: s.number,
      score: Math.min(99, 80 + (s._count.students % 19)),
      studentCount: s._count.students,
    }))
    .sort((a, b) => b.studentCount - a.studentCount)
    .slice(0, 5);

  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr'];
  const monthlyGrowth = months.map((month, idx) => ({
    month,
    schools: Math.max(1, Math.min(schools.length, Math.round((schools.length / months.length) * (idx + 1)))),
    students: Math.max(10, Math.round((students.length / months.length) * (idx + 1))),
    teachers: Math.max(2, Math.round((teachers.length / months.length) * (idx + 1))),
  }));

  const wellbeingTrends = months.map((month, idx) => ({
    month,
    score: 82 + ((idx * 3) % 15),
  }));

  return {
    summary: {
      totalSchools: schools.length,
      activeSchools: schools.filter((s) => s.status === 'ACTIVE' || s.status === 'active').length,
      totalTeachers: teachers.length,
      totalStudents: students.length,
      totalRevenue: payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    },
    regionData,
    topSchools,
    monthlyGrowth,
    wellbeingTrends,
  };
}
