import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PlanService } from '../../services/planService.js';
import { PlanName } from '../../models/Plan.js';

const changePlanSchema = z.object({
  planName: z.enum(['SANDBOX', 'STARTER', 'GROWTH']),
});

const overageSchema = z.object({
  enabled: z.boolean(),
});

export class DashboardPlanController {
  static async listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await PlanService.getAllPlans();
      res.status(200).json({ plans });
    } catch (error) {
      next(error);
    }
  }

  static async changePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const { planName } = changePlanSchema.parse(req.body);

      const result = await PlanService.changeAccountPlan(account, planName as PlanName);

      res.status(200).json({
        message: `Plan changed successfully to ${result.newPlan.displayName}.`,
        plan: result.newPlan,
        notice: result.notice,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleOverage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const plan = req.plan!;
      const { enabled } = overageSchema.parse(req.body);

      if (enabled && !plan.overageAllowed) {
        res.status(422).json({
          error: {
            type: 'plan_validation_error',
            code: 'overage_not_supported',
            message: `Overage billing is not supported on the ${plan.displayName} plan. Please upgrade to Growth.`,
          },
        });
        return;
      }

      account.overageEnabled = enabled;
      await account.save();

      res.status(200).json({
        message: `Overage billing ${enabled ? 'enabled' : 'disabled'}.`,
        overageEnabled: account.overageEnabled,
      });
    } catch (error) {
      next(error);
    }
  }
}
