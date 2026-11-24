import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { Generation } from '../models/Generation.js';
import { getMusicProvider } from '../providers/index.js';
import { StorageService } from '../services/storageService.js';
import { CreditService } from '../services/creditService.js';
import { WebhookService } from '../services/webhookService.js';
import { GenerationJobData } from '../queues/generationQueue.js';
import { logger } from '../config/logger.js';

export function createGenerationWorker(): Worker<GenerationJobData> {
  const connection = getRedisClient();

  const worker = new Worker<GenerationJobData>(
    'generation-jobs',
    async (job: Job<GenerationJobData>) => {
      const { generationId, accountId, prompt, durationSec, license, instrumental } = job.data;
      logger.info('Processing generation job', { jobId: job.id, generationId, accountId });

      const generation = await Generation.findById(generationId);
      if (!generation) {
        logger.error('Generation record not found for job', { generationId });
        return;
      }

      // Check if job was canceled before worker started
      if (generation.status === 'canceled') {
        logger.info('Generation job was canceled prior to processing', { generationId });
        return;
      }

      // Mark generation as running
      generation.status = 'running';
      generation.startedAt = new Date();
      generation.progress = 10;
      await generation.save();

      try {
        // 1. Generate audio via provider abstraction
        const provider = getMusicProvider();
        generation.provider = provider.name;
        (generation as any).model = provider.defaultModel;
        await generation.save();

        const result = await provider.generateMusic({
          generationId,
          prompt,
          durationSec,
          license: license as any,
          instrumental,
        });

        // 2. Upload generated audio buffer to MinIO storage
        generation.progress = 75;
        await generation.save();

        const { storageKey } = await StorageService.uploadAudio(
          accountId,
          generationId,
          result.audioBuffer,
          result.contentType
        );

        // 3. Generate signed URL with expiration (default 15 minutes / 900s)
        const audioUrl = await StorageService.getSignedAudioUrl(storageKey, 900);

        // 4. Update generation record
        generation.storageKey = storageKey;
        generation.audioUrl = audioUrl;
        generation.progress = 100;
        await generation.save();

        // 5. Settle credits atomically (charges the reservation)
        await CreditService.settleGenerationSuccess(generationId);

        logger.info('Generation succeeded', { generationId, storageKey });

        // 6. Trigger webhook event
        await WebhookService.triggerAccountWebhooks(accountId, 'generation.succeeded', {
          id: generation._id.toString(),
          prompt: generation.prompt,
          duration_sec: generation.durationSec,
          license: generation.license,
          instrumental: generation.instrumental,
          audio_url: audioUrl,
          provider: generation.provider,
          model: generation.model,
          created_at: generation.createdAt.toISOString(),
          completed_at: generation.completedAt?.toISOString(),
        });
      } catch (err: any) {
        logger.error('Generation failed in worker', { generationId, error: err.message });

        const errorDetails = {
          code: err.code || 'generation_failed',
          message: err.message || 'Generation failed unexpectedly.',
        };

        // Release reservation so credit balance and parallel slots are freed
        await CreditService.releaseGenerationReservation(generationId, 'failed', errorDetails);

        // Trigger webhook event
        await WebhookService.triggerAccountWebhooks(accountId, 'generation.failed', {
          id: generation._id.toString(),
          prompt: generation.prompt,
          error: errorDetails,
        });

        throw err;
      }
    },
    {
      connection: connection as any,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.info('Generation job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Generation job failed', { jobId: job?.id, error: err.message });
  });

  return worker;
}
