import { Queue, Worker } from 'bullmq';
import { redisConnection, getIsRedisConnected } from '../lib/redis';
import { processFoodAnalysis } from './foodAnalysisProcessor';

export interface FoodAnalysisJobData {
  cameraId: string;
  framePaths: string[];
}

let foodAnalysisQueue: Queue<FoodAnalysisJobData> | null = null;
let foodAnalysisWorker: Worker<FoodAnalysisJobData> | null = null;

if (redisConnection) {
  try {
    foodAnalysisQueue = new Queue<FoodAnalysisJobData>('food-analysis', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    foodAnalysisWorker = new Worker<FoodAnalysisJobData>(
      'food-analysis',
      async (job) => {
        const { cameraId, framePaths } = job.data;
        console.log(`[BullMQ Worker] Job #${job.id} boshlandi: Camera ${cameraId}`);
        await processFoodAnalysis(cameraId, framePaths);
      },
      {
        connection: redisConnection,
        concurrency: 2,
        limiter: {
          max: 10,
          duration: 60000,
        },
      }
    );

    foodAnalysisWorker.on('completed', (job) => {
      console.log(`[BullMQ Worker] Ish muvaffaqiyatli yakunlandi: ${job.id}`);
    });

    foodAnalysisWorker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] Tahlil ishi muvaffaqiyatsiz: ${job?.id}`, err.message);
    });
  } catch (queueInitError: any) {
    console.warn('[BullMQ] Navbatni ishga tushirishda xato (zaxira navbat ishlaydi):', queueInitError.message);
  }
}

/**
 * Tahlil ishini navbatga qo'shish (BullMQ yoki in-memory resilient fallback orqali)
 */
export async function addFoodAnalysisJob(
  cameraId: string,
  framePaths: string[],
  options?: { attempts?: number; delay?: number }
): Promise<{ jobId: string; mode: 'bullmq' | 'in_memory' }> {
  // Agar Redis ulangan va BullMQ faol bo'lsa
  if (foodAnalysisQueue && getIsRedisConnected()) {
    try {
      const job = await foodAnalysisQueue.add(
        'analyze',
        { cameraId, framePaths },
        {
          attempts: options?.attempts ?? 3,
          backoff: { type: 'exponential', delay: options?.delay ?? 5000 },
        }
      );
      return { jobId: String(job.id), mode: 'bullmq' };
    } catch (err: any) {
      console.warn('[Queue] BullMQ qo\'shishda xato, in-memoryga o\'tildi:', err.message);
    }
  }

  // Redis bo'lmaganda yoki xatolikda in-memory asinxron navbat
  const mockJobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  setTimeout(async () => {
    try {
      await processFoodAnalysis(cameraId, framePaths);
    } catch (err: any) {
      console.error(`[In-Memory Worker] Job ${mockJobId} bajarilmadi:`, err.message);
    }
  }, 100);

  return { jobId: mockJobId, mode: 'in_memory' };
}

export { foodAnalysisQueue, foodAnalysisWorker };
