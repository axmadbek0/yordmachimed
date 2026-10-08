import { prisma } from '../lib/prisma';
import { AuthUser } from '../types/auth.types';
import { AppError } from '../utils/errors';
import { analyzeDailyLog } from './aiService';
import { CreateDailyLogInput } from '../validations/dailyLog.validation';

function assertAuthenticated(actor?: AuthUser): asserts actor is AuthUser {
  if (!actor) {
    throw new AppError('Autentifikatsiya talab qilinadi', 401);
  }
}

function assertCanCreateDailyLog(actor: AuthUser): void {
  if (['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(actor.role)) {
    return;
  }
  throw new AppError('Ruxsat rad etildi', 403);
}

async function assertStudentAccess(actor: AuthUser, studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      school_id: true,
      parent_id: true,
      first_name: true,
      last_name: true,
    },
  });

  if (!student) {
    throw new AppError('O\'quvchi topilmadi', 404);
  }

  if (actor.role === 'TEACHER' || actor.role === 'SCHOOL_ADMIN') {
    if (!actor.school_id || student.school_id !== actor.school_id) {
      throw new AppError('Ruxsat rad etildi', 403);
    }
  }

  return student;
}

export async function createDailyLogWithAi(
  actor: AuthUser | undefined,
  input: CreateDailyLogInput
) {
  assertAuthenticated(actor);
  assertCanCreateDailyLog(actor);

  const student = await assertStudentAccess(actor, input.studentId);
  const studentName = `${student.first_name} ${student.last_name}`.trim();

  let aiAnalysis: string | null = null;

  try {
    aiAnalysis = await analyzeDailyLog({
      studentName,
      mood: input.mood,
      health: input.health,
      logText: input.logText,
    });
  } catch (error) {
    console.error('[DailyLog] AI tahlil xatosi, faqat izoh saqlanadi:', error);
  }

  return prisma.dailyLog.create({
    data: {
      student_id: input.studentId,
      teacher_note: input.logText,
      mood: input.mood,
      health: input.health,
      ai_analysis: aiAnalysis,
    },
  });
}

export async function getDailyLogsForStudent(
  actor: AuthUser | undefined,
  studentId: string
) {
  assertAuthenticated(actor);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, school_id: true, parent_id: true },
  });

  if (!student) {
    throw new AppError('O\'quvchi topilmadi', 404);
  }

  if (actor.role === 'PARENT' && student.parent_id !== actor.id) {
    throw new AppError('Ruxsat rad etildi', 403);
  }

  if (
    (actor.role === 'TEACHER' || actor.role === 'SCHOOL_ADMIN') &&
    student.school_id !== actor.school_id
  ) {
    throw new AppError('Ruxsat rad etildi', 403);
  }

  return prisma.dailyLog.findMany({
    where: { student_id: studentId },
    orderBy: { date: 'desc' },
  });
}
