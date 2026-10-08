import { prisma } from '../lib/prisma';
import { analyzeFoodImages } from './aiVisionService';

/**
 * Oshxona kadrlarini AI orqali to'liq qayta ishlash zanjiri
 */
export async function processFoodAnalysis(cameraId: string, framePaths: string[]): Promise<any> {
  try {
    const camera = await prisma.camera.findUnique({
      where: { id: cameraId },
      include: { school: true },
    });

    if (!camera) {
      console.warn(`[FoodAnalysis] Kamera topilmadi: ${cameraId}`);
      return null;
    }

    // 1. Bazada yangi tahlil yozuvini yaratish
    const analysis = await prisma.foodAnalysis.create({
      data: {
        camera_id: camera.id,
        school_id: camera.school_id,
        frame_urls: JSON.stringify(framePaths),
        status: 'PROCESSING',
        captured_at: new Date(),
      },
    });

    // 2. AI orqali tahlil qilish
    const aiResult = await analyzeFoodImages(framePaths);

    // 3. Agar AI xato bersa — holatni FAILED ga o'tkazish
    if (!aiResult.success) {
      const failedRecord = await prisma.foodAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: 'FAILED',
          error_message: aiResult.reason,
          retry_count: { increment: 1 },
        },
      });

      console.warn(`[FoodAnalysis] Tahlil muvaffaqiyatsiz (${aiResult.reason}):`, analysis.id);
      return failedRecord;
    }

    // 4. Muvaffaqiyatli natijani saqlash
    const updated = await prisma.foodAnalysis.update({
      where: { id: analysis.id },
      data: {
        status: 'COMPLETED',
        detected_foods: JSON.stringify(aiResult.result.detectedFoods),
        total_calories: aiResult.result.totalCalories,
        health_score: aiResult.result.healthScore,
        ai_note: aiResult.result.aiNote,
        raw_ai_response: JSON.stringify(aiResult.rawResponse || aiResult.result),
        analyzed_at: new Date(),
      },
    });

    // 5. Kameraning so'nggi kadr holatini muvaffaqiyatli deb belgilash
    await prisma.camera.update({
      where: { id: camera.id },
      data: {
        last_capture_at: new Date(),
        last_capture_status: 'SUCCESS',
      },
    });

    // 6. Ota-onalarga bildirishnoma yuborish
    await notifyParentsOfAnalysis(camera.school_id, updated);

    console.log(`[FoodAnalysis] Muvaffaqiyatli yakunlandi: ${analysis.id} (${camera.school.name})`);
    return updated;
  } catch (error: any) {
    console.error('[FoodAnalysis] processFoodAnalysis kutilmagan xato:', error);
    throw error;
  }
}

/**
 * Tahlil tayyor bo'lganda ota-onalarga bildirishnoma yetkazish
 */
export async function notifyParentsOfAnalysis(schoolId: string, analysisRecord: any): Promise<void> {
  try {
    const parentCount = await prisma.user.count({
      where: {
        school_id: schoolId,
        role: 'PARENT',
      },
    });

    const mealTitle = "Farzandingizning taomnoma tahlili tayyor";
    const mealBody = analysisRecord.ai_note || "Bugungi tushlik hisoboti va kaloriyalar tahlili tayyor — ko'rish uchun bosing";

    // Maktab e'lonlari tizimiga yozish
    const schoolAdminUser = await prisma.user.findFirst({
      where: { school_id: schoolId, role: { in: ['SCHOOL_ADMIN', 'SUPER_ADMIN'] } },
    });

    if (schoolAdminUser) {
      await prisma.announcement.create({
        data: {
          school_id: schoolId,
          sender_id: schoolAdminUser.id,
          title: mealTitle,
          body: mealBody,
          type: 'announcement',
          target_classes: null,
          delivered_count: parentCount,
        },
      });
    }

    // Socket orqali xabar tarqatish (agar Socket.io server mavjud bo'lsa)
    try {
      // Dynamic import to prevent circular dependency
      const { io } = await import('../server');
      if (io) {
        io.to(`school:${schoolId}`).emit('food_analysis_ready', {
          id: analysisRecord.id,
          schoolId,
          totalCalories: analysisRecord.total_calories,
          healthScore: analysisRecord.health_score,
          aiNote: analysisRecord.ai_note,
          analyzedAt: analysisRecord.analyzed_at,
        });
      }
    } catch {
      // Socket ixtiyoriy
    }
  } catch (err: any) {
    console.warn('[FoodAnalysis] Bildirishnoma yuborishda ogohlantirish:', err.message);
  }
}
