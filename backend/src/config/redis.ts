import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    if (process.env.NODE_ENV === 'test') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const RedisMock = require('ioredis-mock');
        redisClient = new RedisMock();
        return redisClient!;
      } catch {
        // Fall back to standard Redis instance if mock not found
      }
    }

    redisClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (process.env.NODE_ENV === 'test') return null; // don't retry in test
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis server');
    });

    redisClient.on('error', (err) => {
      if (process.env.NODE_ENV !== 'test') {
        logger.error('Redis connection error', { error: err.message });
      }
    });
  }

  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // Ignore close error
    }
    redisClient = null;
  }
}
