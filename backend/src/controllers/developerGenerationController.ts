import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GenerationService } from '../services/generationService.js';
import { CreditService, getCurrentPeriodMonth } from '../services/creditService.js';
import { IdempotencyRecord } from '../models/IdempotencyRecord.js';
import { Generation } from '../models/Generation.js';
import { LicenseType } from '../models/Plan.js';
import { Errors } from '../utils/errors.js';

export const createGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt too long'),
  duration: z.coerce.number().min(5).max(600).default(60),
  license: z.enum(['royalty_free', 'sync', 'full_ownership']).default('royalty_free'),
  instrumental: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

function formatGenerationResponse(gen: any) {
  return {
    id: gen._id.toString(),
    object: 'generation',
    status: gen.status,
    prompt: gen.prompt,
    duration_sec: gen.durationSec,
    duration_units: gen.durationUnits,
    license: gen.license,
    instrumental: gen.instrumental,
    credits_reserved: gen.creditsReserved,
    credits_charged: gen.creditsCharged,
    audio_url: gen.audioUrl || null,
    provider: gen.provider,
    model: gen.model,
    progress: gen.progress,
    error: gen.error || null,
    metadata: gen.metadata || {},
    queued_at: gen.queuedAt?.toISOString(),
    started_at: gen.startedAt?.toISOString() || null,
    completed_at: gen.completedAt?.toISOString() || null,
    created_at: gen.createdAt?.toISOString(),
  };
}

export class DeveloperGenerationController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const plan = req.plan!;
      const apiKey = req.apiKey;
      const idempotencyKey = req.idempotencyKey;
      const idempotencyRecord = req.idempotencyRecord;

      const body = createGenerationSchema.parse(req.body);

      // Create generation via service
      const generation = await GenerationService.createGeneration({
        account,
        plan,
        apiKey,
        prompt: body.prompt,
        durationSec: body.duration,
        license: body.license as LicenseType,
        instrumental: body.instrumental,
        idempotencyKey,
        metadata: body.metadata,
        synchronousInTest: process.env.NODE_ENV === 'test',
      });

      const responsePayload = formatGenerationResponse(generation);

      // If an idempotency record was started, atomically complete it with the response
      if (idempotencyRecord) {
        await IdempotencyRecord.updateOne(
          { _id: idempotencyRecord._id },
          {
            $set: {
              status: 'completed',
              responseStatus: 201,
              responseBody: responsePayload,
              generationId: generation._id,
            },
          }
        );
      }

      res.status(201).json(responsePayload);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const { id } = req.params;

      const generation = await GenerationService.getGenerationById(id, account._id.toString());
      res.status(200).json(formatGenerationResponse(generation));
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const status = req.query.status as string | undefined;
      const license = req.query.license as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await GenerationService.listGenerations(account._id.toString(), {
        status,
        license,
        limit,
        offset,
      });

      res.status(200).json({
        object: 'list',
        data: result.generations.map(formatGenerationResponse),
        total: result.total,
        limit,
        offset,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const { id } = req.params;

      const generation = await GenerationService.cancelGeneration(id, account._id.toString());
      res.status(200).json(formatGenerationResponse(generation));
    } catch (error) {
      next(error);
    }
  }

  static async getUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const plan = req.plan!;
      const periodMonth = getCurrentPeriodMonth();

      const usage = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);
      const activeJobs = await Generation.countDocuments({
        accountId: account._id,
        status: { $in: ['queued', 'running'] },
      });

      const remainingCredits = Math.max(0, plan.monthlyAllowance - usage.totalConsumed);
      const overageCredits = Math.max(0, usage.totalConsumed - plan.monthlyAllowance);

      res.status(200).json({
        object: 'usage',
        account_id: account._id.toString(),
        plan: {
          name: plan.name,
          display_name: plan.displayName,
          monthly_allowance: plan.monthlyAllowance,
          parallel_limit: plan.parallelLimit,
          requests_per_hour: plan.requestsPerHour,
          requests_per_day: plan.requestsPerDay,
          allowed_licenses: plan.allowedLicenses,
          overage_allowed: plan.overageAllowed,
        },
        period_month: periodMonth,
        credits: {
          monthly_allowance: plan.monthlyAllowance,
          credits_used: usage.chargedCredits,
          credits_reserved: usage.reservedCredits,
          total_consumed: usage.totalConsumed,
          credits_remaining: remainingCredits,
          overage_used: overageCredits,
          overage_enabled: account.overageEnabled,
        },
        concurrency: {
          active_jobs: activeJobs,
          parallel_limit: plan.parallelLimit,
          slots_available: Math.max(0, plan.parallelLimit - activeJobs),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
