import { Plan, IPlan, PlanName } from '../models/Plan.js';
import { Account, IAccount } from '../models/Account.js';
import { CreditService, getCurrentPeriodMonth } from './creditService.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export const DEFAULT_PLANS: Array<Partial<IPlan>> = [
  {
    name: 'SANDBOX',
    displayName: 'Sandbox',
    monthlyAllowance: 0,
    parallelLimit: 1,
    requestsPerHour: 60,
    requestsPerDay: 500,
    allowedLicenses: ['royalty_free'],
    allowTestKeysOnly: true,
    overageAllowed: false,
    priceMonthlyUsd: 0,
  },
  {
    name: 'STARTER',
    displayName: 'Starter',
    monthlyAllowance: 200,
    parallelLimit: 3,
    requestsPerHour: 300,
    requestsPerDay: 3000,
    allowedLicenses: ['royalty_free', 'sync'],
    allowTestKeysOnly: false,
    overageAllowed: false,
    priceMonthlyUsd: 29,
  },
  {
    name: 'GROWTH',
    displayName: 'Growth',
    monthlyAllowance: 2000,
    parallelLimit: 10,
    requestsPerHour: 2000,
    requestsPerDay: 30000,
    allowedLicenses: ['royalty_free', 'sync', 'full_ownership'],
    allowTestKeysOnly: false,
    overageAllowed: true,
    priceMonthlyUsd: 199,
  },
];

export class PlanService {
  /**
   * Seeds or updates standard plans in MongoDB.
   */
  static async seedPlans(): Promise<void> {
    for (const planData of DEFAULT_PLANS) {
      await Plan.findOneAndUpdate(
        { name: planData.name },
        { $set: planData },
        { upsert: true, new: true }
      );
    }
    logger.info('Standard subscription plans initialized');
  }

  static async getPlanByName(name: PlanName): Promise<IPlan> {
    const plan = await Plan.findOne({ name });
    if (!plan) {
      throw Errors.notFound(`Plan '${name}'`);
    }
    return plan;
  }

  static async getAllPlans(): Promise<IPlan[]> {
    return Plan.find().sort({ priceMonthlyUsd: 1 });
  }

  /**
   * Handles plan upgrade/downgrade policy:
   * Policy:
   * 1. Historical usage ledger records are preserved permanently (never erased).
   * 2. If an account downgrades to a lower plan (e.g. Growth -> Starter) after having already consumed
   *    more credits than the new plan's allowance (e.g. 1,500 credits used, new allowance is 200 credits),
   *    the account's new allowance is effectively immediately exhausted. No new requests will be allowed
   *    under the new plan until the next monthly billing cycle resets, unless overage is permitted.
   */
  static async changeAccountPlan(account: IAccount, targetPlanName: PlanName): Promise<{
    account: IAccount;
    newPlan: IPlan;
    notice?: string;
  }> {
    const newPlan = await this.getPlanByName(targetPlanName);
    const oldPlanId = account.planId;

    account.planId = newPlan._id;
    await account.save();

    // Check if account has already consumed more than the new allowance in the current period
    const { totalConsumed } = await CreditService.getCurrentPeriodUsage(account._id, getCurrentPeriodMonth());
    let notice: string | undefined;

    if (totalConsumed >= newPlan.monthlyAllowance && newPlan.monthlyAllowance > 0) {
      notice = `You have consumed ${totalConsumed} credits this period, which exceeds the ${newPlan.displayName} plan allowance of ${newPlan.monthlyAllowance} credits. New generation requests will be blocked until next period unless upgraded.`;
      logger.info('Plan downgrade over-allowance notice', {
        accountId: account._id,
        totalConsumed,
        newAllowance: newPlan.monthlyAllowance,
      });
    }

    return { account, newPlan, notice };
  }
}
