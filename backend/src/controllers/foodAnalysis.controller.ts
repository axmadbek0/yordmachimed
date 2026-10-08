import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types/auth.types';
import { AppError } from '../utils/AppError';
import { runScheduledKitchenCapture } from '../services/scheduler';
import { processFoodAnalysis } from '../services/foodAnalysisProcessor';
import path from 'path';
import fs from 'fs';

function mapFoodAnalysisRecord(record: any) {
  let detectedFoods = [];
  try {
    if (record.detected_foods) {
      detectedFoods = typeof record.detected_foods === 'string'
        ? JSON.parse(record.detected_foods)
        : record.detected_foods;
    }
  } catch {
    detectedFoods = [];
  }

  let frameUrls: string[] = [];
  try {
    if (record.frame_urls) {
      frameUrls = typeof record.frame_urls === 'string'
        ? JSON.parse(record.frame_urls)
        : record.frame_urls;
    }
  } catch {
    frameUrls = [];
  }

  return {
    id: record.id,
    cameraId: record.camera_id,
    cameraLabel: record.camera?.sector_label || "Oshxona zali",
    schoolId: record.school_id,
    schoolName: record.school?.name,
    frameUrls,
    status: record.status, // PENDING, PROCESSING, COMPLETED, FAILED
    detectedFoods,
    totalCalories: record.total_calories,
    healthScore: record.health_score || 'UNKNOWN', // BALANCED, NEEDS_ATTENTION, UNKNOWN
    aiNote: record.ai_note,
    errorMessage: record.error_message,
    retryCount: record.retry_count,
    capturedAt: record.captured_at,
    analyzedAt: record.analyzed_at,
    createdAt: record.created_at,
  };
}

/**
 * GET /api/food-analysis
 * Maktabga tegishli barcha tahlillar ro'yxati (xavfsiz scoping bilan)
 */
export async function getFoodAnalyses(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId || req.user?.school_id;
    if (!schoolId) {
      throw AppError.unauthorized("Foydalanuvchiga biriktirilgan maktab topilmadi");
    }

    const { status, limit = 20, cameraId } = req.query;

    const where: any = {
      school_id: schoolId,
    };

    if (status && typeof status === 'string') {
      where.status = status.toUpperCase();
    }
    if (cameraId && typeof cameraId === 'string') {
      where.camera_id = cameraId;
    }

    const analyses = await prisma.foodAnalysis.findMany({
      where,
      include: {
        camera: {
          select: { id: true, sector_label: true, stream_url: true, last_capture_status: true },
        },
        school: {
          select: { id: true, name: true, number: true },
        },
      },
      orderBy: { captured_at: 'desc' },
      take: Number(limit) || 20,
    });

    res.json({
      success: true,
      data: analyses.map(mapFoodAnalysisRecord),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/food-analysis/latest
 * Eng so'nggi muvaffaqiyatli tahlil natijasi
 */
export async function getLatestFoodAnalysis(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId || req.user?.school_id;
    if (!schoolId) {
      throw AppError.unauthorized("Maktab aniqlanmadi");
    }

    // Avval so'nggi COMPLETED tahlilni qidiramiz
    let latest = await prisma.foodAnalysis.findFirst({
      where: {
        school_id: schoolId,
        status: 'COMPLETED',
      },
      include: {
        camera: {
          select: { id: true, sector_label: true, stream_url: true, last_capture_status: true },
        },
        school: {
          select: { id: true, name: true, number: true },
        },
      },
      orderBy: { captured_at: 'desc' },
    });

    // Agar COMPLETED bo'lmasa, eng so'nggi har qanday tahlilni ko'ramiz
    if (!latest) {
      latest = await prisma.foodAnalysis.findFirst({
        where: {
          school_id: schoolId,
        },
        include: {
          camera: {
            select: { id: true, sector_label: true, stream_url: true, last_capture_status: true },
          },
          school: {
            select: { id: true, name: true, number: true },
          },
        },
        orderBy: { captured_at: 'desc' },
      });
    }

    if (!latest) {
      // Maktabdagi oshxona kamerasini tekshirib, holatni qaytaramiz
      const kitchenCamera = await prisma.camera.findFirst({
        where: { school_id: schoolId, type: 'KITCHEN' },
      });

      res.json({
        success: true,
        data: null,
        cameraStatus: kitchenCamera ? kitchenCamera.last_capture_status : 'CAMERA_OFFLINE',
        message: 'Hozircha tahlil mavjud emas',
      });
      return;
    }

    res.json({
      success: true,
      data: mapFoodAnalysisRecord(latest),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/food-analysis/:id
 */
export async function getFoodAnalysisById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId || req.user?.school_id;
    if (!schoolId) {
      throw AppError.unauthorized("Maktab aniqlanmadi");
    }

    const { id } = req.params;

    const analysis = await prisma.foodAnalysis.findFirst({
      where: {
        id,
        school_id: schoolId, // Xavfsizlik: begona maktab tahlilini ko'ra olmaydi
      },
      include: {
        camera: true,
        school: true,
      },
    });

    if (!analysis) {
      throw AppError.notFound("Tahlil ma'lumotlari topilmadi");
    }

    res.json({
      success: true,
      data: mapFoodAnalysisRecord(analysis),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/food-analysis/trigger
 * Qo'lda tahlilni ishga tushirish (test yoki admin uchun)
 */
export async function triggerFoodAnalysis(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const schoolId = req.schoolId || req.user?.school_id;
    if (!schoolId) {
      throw AppError.unauthorized("Maktab aniqlanmadi");
    }

    const { cameraId } = req.body;

    let targetCamera;
    if (cameraId) {
      targetCamera = await prisma.camera.findFirst({
        where: { id: cameraId, school_id: schoolId },
      });
    } else {
      targetCamera = await prisma.camera.findFirst({
        where: { school_id: schoolId, type: 'KITCHEN', is_active: true },
      });
    }

    if (!targetCamera) {
      throw AppError.notFound("Faol oshxona kamerasi topilmadi");
    }

    // Kadr olish va darhol qayta ishlash
    const result = await runScheduledKitchenCapture(schoolId, targetCamera.id);

    res.json({
      success: true,
      message: "Tahlil jarayoni muvaffaqiyatli ishga tushirildi",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
