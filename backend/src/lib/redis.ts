import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const enableRedis = process.env.ENABLE_REDIS === 'true' || Boolean(process.env.REDIS_URL);

let isRedisConnected = false;
let redisConnection: IORedis | null = null;

if (enableRedis) {
  try {
    redisConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          return null; // Stop reconnecting after 3 tries
        }
        return Math.min(times * 1000, 3000);
      },
    });

    redisConnection.on('connect', () => {
      isRedisConnected = true;
      console.log('[Redis] Ulanish muvaffaqiyatli');
    });

    redisConnection.on('error', (err) => {
      isRedisConnected = false;
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[Redis] Ulanish xatosi (in-memory navbatga o\'tiladi):', err.message);
      }
    });

    redisConnection.connect().catch(() => {
      // In-memory fallback
    });
  } catch (err: any) {
    console.warn('[Redis] Initializatsiya ogohlantirish:', err.message);
  }
}

export { redisConnection };

export function getIsRedisConnected(): boolean {
  return isRedisConnected && redisConnection !== null;
}
