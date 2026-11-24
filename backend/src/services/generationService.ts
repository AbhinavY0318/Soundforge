import { Types } from 'mongoose';
import { IAccount } from '../models/Account.js';
import { IPlan, LicenseType } from '../models/Plan.js';
import { IApiKey } from '../models/ApiKey.js';
import { Generation, IGeneration } from '../models/Generation.js';
import { CreditService, getCurrentPeriodMonth } from './creditService.js';
import { StorageService } from './storageService.js';
import { getGenerationQueue } from '../queues/generationQueue.js';
import { getMusicProvider } from '../providers/index.js';
import { WebhookService } from './webhookService.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export interface CreateGenerationInput {
  account: IAccount;
  plan: IPlan;
  apiKey?: IApiKey;
  prompt: string;
  durationSec: number;
  license: LicenseType;
  instrumental?: boolean;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  synchronousInTest?: boolean; // For fast integration testing
}

export class GenerationService {
  /**
   * High-level generation initiation:
   * 1. Validates inputs
   * 2. Reserves slot & credits atomically
   * 3. Dispatches BullMQ queue job
   */
  static async createGeneration(input: CreateGenerationInput): Promise<IGeneration> {
    const {
      account,
      plan,
      apiKey,
      prompt,
      durationSec,
      license,
      instrumental = true,
      idempotencyKey,
      metadata,
    } = input;

    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      throw Errors.badRequest('Music generation prompt cannot be empty.', 'invalid_prompt', 'prompt');
    }

    if (prompt.length > 1000) {
      throw Errors.badRequest('Prompt length cannot exceed 1000 characters.', 'prompt_too_long', 'prompt');
    }

    // Validate duration bounds (5 to 600 seconds)
    if (durationSec < 5 || durationSec > 600) {
      throw Errors.badRequest('Duration must be between 5 and 600 seconds.', 'invalid_duration', 'duration');
    }

    const provider = getMusicProvider();

    // 1. Atomically reserve slot & credits
    const generation = await CreditService.reserveCreditsAndSlot({
      account,
      plan,
      apiKeyId: apiKey?._id,
      prompt: prompt.trim(),
      durationSec,
      license,
      instrumental,
      idempotencyKey,
      provider: provider.name,
      model: provider.defaultModel,
      metadata,
    });

    // 2. Dispatch to BullMQ generation queue (skip BullMQ in unit tests where live Redis server is not running)
    if (process.env.NODE_ENV !== 'test') {
      try {
        const queue = getGenerationQueue();
        await queue.add(
          'generate-music',
          {
            generationId: generation._id.toString(),
            accountId: account._id.toString(),
            prompt: generation.prompt,
            durationSec: generation.durationSec,
            license: generation.license,
            instrumental: generation.instrumental,
            provider: provider.name,
            model: provider.defaultModel,
          },
          {
            jobId: generation._id.toString(), // deterministic job ID prevents duplicates
          }
        );
      } catch (queueErr: any) {
        // If BullMQ fails or Redis is offline, run in background asynchronously without blocking HTTP response
        this.processJobDirectly(generation._id.toString(), account._id.toString()).catch(() => {});
      }
    }

    return generation;
  }

  /**
   * Helper that executes the generation pipeline directly (used during tests or fallback).
   */
  static async processJobDirectly(generationId: string, accountId: string): Promise<void> {
    const generation = await Generation.findById(generationId);
    if (!generation || generation.status === 'canceled') return;

    generation.status = 'running';
    generation.startedAt = new Date();
    await generation.save();

    try {
      const provider = getMusicProvider();
      const result = await provider.generateMusic({
        generationId,
        prompt: generation.prompt,
        durationSec: generation.durationSec,
        license: generation.license as any,
        instrumental: generation.instrumental,
      });

      const { storageKey } = await StorageService.uploadAudio(
        accountId,
        generationId,
        result.audioBuffer,
        result.contentType
      );

      const audioUrl = await StorageService.getSignedAudioUrl(storageKey, 900);

      generation.storageKey = storageKey;
      generation.audioUrl = audioUrl;
      generation.progress = 100;
      await generation.save();

      await CreditService.settleGenerationSuccess(generationId);

      await WebhookService.triggerAccountWebhooks(accountId, 'generation.succeeded', {
        id: generation._id.toString(),
        prompt: generation.prompt,
        audio_url: audioUrl,
      });
    } catch (err: any) {
      await CreditService.releaseGenerationReservation(generationId, 'failed', {
        code: err.code || 'generation_failed',
        message: err.message,
      });

      await WebhookService.triggerAccountWebhooks(accountId, 'generation.failed', {
        id: generation._id.toString(),
        error: { message: err.message },
      });
    }
  }

  /**
   * Retrieves a generation by ID, verifying tenant isolation.
   */
  static async getGenerationById(generationId: string, accountId: string): Promise<IGeneration> {
    if (!Types.ObjectId.isValid(generationId)) {
      throw Errors.notFound('Generation');
    }

    const generation = await Generation.findOne({
      _id: generationId,
      accountId: new Types.ObjectId(accountId),
    });

    if (!generation) {
      // Acceptance Test 9: Account B cannot access Account A's generation -> 404
      throw Errors.notFound('Generation');
    }

    // Refresh signed URL if expired or audio exists
    if (generation.storageKey && generation.status === 'succeeded') {
      generation.audioUrl = await StorageService.getSignedAudioUrl(generation.storageKey, 900);
    }

    return generation;
  }

  /**
   * Lists generations for an account with filters & pagination.
   */
  static async listGenerations(
    accountId: string,
    query: {
      status?: string;
      license?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ generations: IGeneration[]; total: number }> {
    const filter: Record<string, unknown> = {
      accountId: new Types.ObjectId(accountId),
    };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.license) {
      filter.license = query.license;
    }

    const limit = Math.min(query.limit || 20, 100);
    const offset = query.offset || 0;

    const [generations, total] = await Promise.all([
      Generation.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit),
      Generation.countDocuments(filter),
    ]);

    // Refresh signed URLs for succeeded items
    for (const gen of generations) {
      if (gen.storageKey && gen.status === 'succeeded') {
        gen.audioUrl = await StorageService.getSignedAudioUrl(gen.storageKey, 900);
      }
    }

    return { generations, total };
  }

  /**
   * Cancels a queued or running generation, releasing reserved credits and parallel slot.
   */
  static async cancelGeneration(generationId: string, accountId: string): Promise<IGeneration> {
    if (!Types.ObjectId.isValid(generationId)) {
      throw Errors.notFound('Generation');
    }

    const generation = await Generation.findOne({
      _id: generationId,
      accountId: new Types.ObjectId(accountId),
    });

    if (!generation) {
      throw Errors.notFound('Generation');
    }

    if (generation.status === 'succeeded') {
      throw Errors.badRequest('Cannot cancel a completed generation.');
    }

    if (generation.status === 'failed' || generation.status === 'canceled') {
      return generation;
    }

    // Try removing from BullMQ queue if still waiting
    try {
      const queue = getGenerationQueue();
      const job = await queue.getJob(generationId);
      if (job) {
        await job.remove();
      }
    } catch {
      // Ignore queue cancellation error
    }

    // Release reservation and mark status canceled
    await CreditService.releaseGenerationReservation(generationId, 'canceled', {
      code: 'user_canceled',
      message: 'Generation was canceled by the user.',
    });

    return (await Generation.findById(generationId))!;
  }
}
