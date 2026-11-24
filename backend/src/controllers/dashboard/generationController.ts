import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GenerationService } from '../../services/generationService.js';
import { CreditService, getCurrentPeriodMonth } from '../../services/creditService.js';
import { Generation } from '../../models/Generation.js';
import { UsageLedger } from '../../models/UsageLedger.js';
import { LicenseType } from '../../models/Plan.js';

const dashboardGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000),
  durationSec: z.coerce.number().min(5).max(600).default(60),
  license: z.enum(['royalty_free', 'sync', 'full_ownership']).default('royalty_free'),
  instrumental: z.boolean().default(true),
});

export class DashboardGenerationController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const plan = req.plan!;
      const body = dashboardGenerationSchema.parse(req.body);

      const generation = await GenerationService.createGeneration({
        account,
        plan,
        prompt: body.prompt,
        durationSec: body.durationSec,
        license: body.license as LicenseType,
        instrumental: body.instrumental,
      });

      res.status(201).json({ generation });
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

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const { id } = req.params;

      const generation = await GenerationService.cancelGeneration(id, account._id.toString());
      res.status(200).json({ generation });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const plan = req.plan!;
      const periodMonth = getCurrentPeriodMonth();

      const [
        totalGenerations,
        succeededGenerations,
        failedGenerations,
        activeGenerations,
        usage,
        recentActivity,
      ] = await Promise.all([
        Generation.countDocuments({ accountId: account._id }),
        Generation.countDocuments({ accountId: account._id, status: 'succeeded' }),
        Generation.countDocuments({ accountId: account._id, status: 'failed' }),
        Generation.countDocuments({ accountId: account._id, status: { $in: ['queued', 'running'] } }),
        CreditService.getCurrentPeriodUsage(account._id, periodMonth),
        Generation.find({ accountId: account._id }).sort({ createdAt: -1 }).limit(5),
      ]);

      const successRate =
        totalGenerations > 0 ? Math.round((succeededGenerations / totalGenerations) * 100) : 100;
      const remainingCredits = Math.max(0, plan.monthlyAllowance - usage.totalConsumed);

      res.status(200).json({
        totalGenerations,
        succeededGenerations,
        failedGenerations,
        activeGenerations,
        successRate,
        creditsConsumed: usage.totalConsumed,
        remainingCredits,
        monthlyAllowance: plan.monthlyAllowance,
        parallelLimit: plan.parallelLimit,
        recentActivity,
      });
    } catch (error) {
      next(error);
    }
  }
}
