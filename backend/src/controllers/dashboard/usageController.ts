import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { UsageLedger } from '../../models/UsageLedger.js';
import { ApiKey } from '../../models/ApiKey.js';
import { CreditService, getCurrentPeriodMonth } from '../../services/creditService.js';

export class DashboardUsageController {
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const plan = req.plan!;
      const periodMonth = getCurrentPeriodMonth();

      const usage = await CreditService.getCurrentPeriodUsage(account._id, periodMonth);
      const remainingCredits = Math.max(0, plan.monthlyAllowance - usage.totalConsumed);
      const overageCredits = Math.max(0, usage.totalConsumed - plan.monthlyAllowance);

      // Aggregate daily credit usage for current month
      const startOfMonth = new Date();
      startOfMonth.setUTCDate(1);
      startOfMonth.setUTCHours(0, 0, 0, 0);

      const dailyAgg = await UsageLedger.aggregate([
        {
          $match: {
            accountId: account._id,
            createdAt: { $gte: startOfMonth },
            eventType: 'charge',
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            credits: { $sum: '$credits' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Aggregate usage by API key
      const keyAgg = await UsageLedger.aggregate([
        {
          $match: {
            accountId: account._id,
            periodMonth,
            eventType: 'charge',
          },
        },
        {
          $group: {
            _id: '$apiKeyId',
            credits: { $sum: '$credits' },
            generationsCount: { $sum: 1 },
          },
        },
      ]);

      const keyIds = keyAgg.map((k) => k._id).filter(Boolean);
      const keys = await ApiKey.find({ _id: { $in: keyIds } });
      const keyMap = new Map(keys.map((k) => [k._id.toString(), k]));

      const perKeyUsage = keyAgg.map((k) => {
        const apiKey = k._id ? keyMap.get(k._id.toString()) : null;
        return {
          apiKeyId: k._id ? k._id.toString() : 'dashboard',
          keyName: apiKey ? apiKey.name : 'Dashboard UI',
          keyPrefix: apiKey ? apiKey.keyPrefix : 'Direct Web Session',
          mode: apiKey ? apiKey.mode : 'live',
          credits: k.credits,
          generationsCount: k.generationsCount,
        };
      });

      // Recent ledger entries
      const recentLedger = await UsageLedger.find({ accountId: account._id })
        .sort({ createdAt: -1 })
        .limit(20);

      res.status(200).json({
        plan: {
          name: plan.name,
          displayName: plan.displayName,
          monthlyAllowance: plan.monthlyAllowance,
          parallelLimit: plan.parallelLimit,
          overageAllowed: plan.overageAllowed,
        },
        periodMonth,
        credits: {
          monthlyAllowance: plan.monthlyAllowance,
          used: usage.chargedCredits,
          reserved: usage.reservedCredits,
          totalConsumed: usage.totalConsumed,
          remaining: remainingCredits,
          overageUsed: overageCredits,
          overageEnabled: account.overageEnabled,
        },
        dailyUsage: dailyAgg.map((d) => ({
          date: d._id,
          credits: d.credits,
          count: d.count,
        })),
        perKeyUsage,
        recentLedger,
      });
    } catch (error) {
      next(error);
    }
  }
}
