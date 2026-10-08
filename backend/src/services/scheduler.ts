import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import { captureFrame } from './frameCaptureService';
import { addFoodAnalysisJob } from './foodAnalysisQueue';

const FRAMES_DIR = path.resolve(process.cwd(), 'uploads/food-frames');

/**
 * Oshxona AI tahlili rejalashtiruvchisi (Scheduler)
 * Har kuni nonushta (08:00), tushlik (13:00) va kechki ovqat (18:00) vaqtlarida avtomatik ishga tushadi
 */
export function initFoodAnalysisScheduler(): void {
  // Papka mavjudligini tekshirish
  if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
  }

  // Cron schedule: 08:00, 13:00, 18:00
  cron.schedule('0 8,13,18 * * *', async () => {
    console.log('[Scheduler] Oshxona kameralaridan kadr olish boshlandi...');
    await runScheduledKitchenCapture();
  });

  console.log('[Scheduler] Oshxona AI tahlil cron jadvallari (08:00, 13:00, 18:00) faollashtirildi');
}

/**
 * Barcha faol oshxona kameralari bo'yicha kadr olish va navbatga qo'shish
 */
export async function runScheduledKitchenCapture(filterSchoolId?: string, filterCameraId?: string): Promise<{
  processed: number;
  successfulCaptures: number;
  failedCaptures: number;
}> {
  if (!fs.existsSync(FRAMES_DIR)) {
    fs.mkdirSync(FRAMES_DIR, { recursive: true });
  }

  const whereClause: any = {
    type: 'KITCHEN',
    is_active: true,
  };

  if (filterSchoolId) {
    whereClause.school_id = filterSchoolId;
  }
  if (filterCameraId) {
    whereClause.id = filterCameraId;
  }

  const activeCameras = await prisma.camera.findMany({
    where: whereClause,
  });

  let successfulCaptures = 0;
  let failedCaptures = 0;

  for (const camera of activeCameras) {
    try {
      const streamUrl = camera.stream_url;
      if (!streamUrl) {
        await prisma.camera.update({
          where: { id: camera.id },
          data: { last_capture_status: 'CAMERA_OFFLINE' },
        });
        failedCaptures++;
        continue;
      }

      const timestamp = Date.now();
      const outputFilePath = path.join(FRAMES_DIR, `frame-${camera.id}-${timestamp}.jpg`);

      const capture = await captureFrame(streamUrl, outputFilePath);

      if (!capture.success) {
        console.warn(`[Scheduler] Kadr olib bo'lmadi (${camera.id}): ${capture.reason}`);
        await prisma.camera.update({
          where: { id: camera.id },
          data: {
            last_capture_status: capture.reason === 'OFFLINE' ? 'CAMERA_OFFLINE' : 'CAPTURE_FAILED',
          },
        });
        failedCaptures++;
        // Bitta kamera xato qilsa ham boshqa maktablar to'xtamasligi uchun continue
        continue;
      }

      // Muvaffaqiyatli kadr olindi
      successfulCaptures++;

      // Navbatga qo'shish
      await addFoodAnalysisJob(camera.id, [capture.path], {
        attempts: 3,
        delay: 5000,
      });

      console.log(`[Scheduler] Kamera ${camera.id} kadri navbatga qo'shildi`);
    } catch (cameraLoopError: any) {
      console.error(`[Scheduler] Kamera ${camera.id} bilan ishlashda xatolik:`, cameraLoopError.message);
      failedCaptures++;
      continue;
    }
  }

  return {
    processed: activeCameras.length,
    successfulCaptures,
    failedCaptures,
  };
}
