import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface GenerationJobData {
  generationId: string;
  accountId: string;
  prompt: string;
  durationSec: number;
  license: string;
  instrumental: boolean;
  provider: string;
  model: string;
}

let generationQueue: Queue<GenerationJobData> | null = null;

export function getGenerationQueue(): Queue<GenerationJobData> {
  if (!generationQueue) {
    const connection = getRedisClient();
    generationQueue = new Queue<GenerationJobData>('generation-jobs', {
      connection: connection as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 86400, // keep completed jobs for 24h
        },
        removeOnFail: {
          age: 86400 * 7, // keep failed jobs for 7d
        },
      },
    });

    generationQueue.on('error', (err) => {
      logger.error('Generation queue error', { error: err.message });
    });
  }

  return generationQueue;
}
