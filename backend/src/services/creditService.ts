import { Types } from 'mongoose';
import { IAccount } from '../models/Account.js';
import { IPlan, LicenseType } from '../models/Plan.js';
import { Generation, IGeneration } from '../models/Generation.js';
import { UsageLedger } from '../models/UsageLedger.js';
import { getRedisClient } from '../config/redis.js';
import { Errors } from '../utils/errors.js';
import { calculateRequiredCredits } from '../utils/creditCalculator.js';
import { logger } from '../config/logger.js';

export function getCurrentPeriodMonth(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

class AccountMutex {
  private queue = Promise.resolve();
  lock(): Promise<() => void> {
    let unlock: () => void;
    const next = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    const willLock = this.queue.then(() => unlock);
    this.queue = this.queue.then(() => next);
    return willLock;
  }
}

const localMutexes = new Map<string, AccountMutex>();
function getLocalMutex(accountId: string): AccountMutex {
  let m = localMutexes.get(accountId);
  if (!m) {
    m = new AccountMutex();
    localMutexes.set(accountId, m);
  }
  return m;
}

export class CreditService {
  /**
   * Distributed lock helper per account combining in-process mutex queue and Redis distributed locking.
   */
  private static async acquireAccountLock(accountId: string, timeoutMs = 8000): Promise<() => Promise<void>> {
    const releaseLocal = await getLocalMutex(accountId).lock();

    const lockKey = `lock:account:${accountId}`;
    const token = Math.random().toString(36).substring(2);

    let redisLocked = false;
    try {
      const redis = getRedisClient();
      if (redis.status === 'ready') {
        const result = await redis.set(lockKey, token, 'PX', timeoutMs, 'NX');
        if (result === 'OK') {
          redisLocked = true;
        }
      }
    } catch {
      // Redis offline; localMutex guarantees intra-process concurrency safety
    }

    return async () => {
      try {
        if (redisLocked) {
          const redis = getRedisClient();
          const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
              return redis.call("del", KEYS[1])
            else
              return 0
            end
          `;
          await redis.eval(script, 1, lockKey, token);
        }
      } catch {
        // Ignore redis release errors
      } finally {
        releaseLocal();
      }
    };
  }

  /**
   * Calculates total credits consumed (charges + active reservations) in the current billing period.
   */
  static async getCurrentPeriodUsage(accountId: Types.ObjectId | string, periodMonth?: string): Promise<{
    chargedCredits: number;
    reservedCredits: number;
    totalConsumed: number;
  }> {
    const period = periodMonth || getCurrentPeriodMonth();
    const accountObjectId = typeof accountId === 'string' ? new Types.ObjectId(accountId) : accountId;

    const aggregation = await UsageLedger.aggregate([
      {
        $match: {
          accountId: accountObjectId,
          periodMonth: period,
          eventType: { $in: ['reservation', 'charge', 'refund', 'adjustment'] },
        },
      },
      {
        $group: {
          _id: '$eventType',
          totalCredits: { $sum: '$credits' },
        },
      },
    ]);

    let charged = 0;
    let reserved = 0;
    let refunded = 0;
    let adjustments = 0;

    for (const item of aggregation) {
      if (item._id === 'charge') charged = item.totalCredits;
      if (item._id === 'reservation') reserved = item.totalCredits;
      if (item._id === 'refund') refunded = item.totalCredits;
      if (item._id === 'adjustment') adjustments = item.totalCredits;
    }

    const netReserved = Math.max(0, reserved - refunded);
    const totalConsumed = charged + netReserved + adjustments;

    return {
      chargedCredits: charged,
      reservedCredits: netReserved,
      totalConsumed,
    };
  }

  /**
   * Atomically validates parallel generation limit, license permission, and credit balance,
   * then reserves credits and returns calculation details.
   */
  static async reserveCreditsAndSlot(params: {
    account: IAccount;
    plan: IPlan;
    apiKeyId?: Types.ObjectId;
    prompt: string;
    durationSec: number;
    license: LicenseType;
    instrumental: boolean;
    idempotencyKey?: string;
    provider: string;
    model: string;
    metadata?: Record<string, unknown>;
  }): Promise<IGeneration> {
    const { account, plan, durationSec, license } = params;
    const accountId = account._id.toString();

    // 1. Verify license is permitted under current plan
    if (!plan.allowedLicenses.includes(license)) {
      throw Errors.planValidationError(
        `License '${license}' is not permitted on the ${plan.displayName} plan. Allowed licenses: ${plan.allowedLicenses.join(', ')}.`,
        'license_not_allowed',
        'license'
      );
    }

    // 2. Calculate required credit costs
    const { durationUnits, totalCredits } = calculateRequiredCredits(durationSec, license);

    // 3. Acquire distributed account lock to prevent concurrent race conditions
    const releaseLock = await this.acquireAccountLock(accountId);

    try {
      // 4. Atomically check parallel active generations count
      const activeCount = await Generation.countDocuments({
        accountId: account._id,
        status: { $in: ['queued', 'running'] },
      });

      if (activeCount >= plan.parallelLimit) {
        logger.warn('Parallel generation limit reached', {
          accountId,
          activeCount,
          parallelLimit: plan.parallelLimit,
        });
        throw Errors.parallelLimitError(
          `Your account has reached its parallel generation limit (${plan.parallelLimit} concurrent active jobs). Please wait for active jobs to complete.`
        );
      }

      // 5. Atomically check available credits for this month
      if (plan.name === 'SANDBOX') {
        const generation = await Generation.create({
          accountId: account._id,
          apiKeyId: params.apiKeyId,
          idempotencyKey: params.idempotencyKey,
          prompt: params.prompt,
          durationSec,
          durationUnits,
          license,
          instrumental: params.instrumental,
          status: 'queued',
          creditsReserved: 0,
          creditsCharged: 0,
          provider: params.provider,
          model: params.model,
          metadata: params.metadata,
          queuedAt: new Date(),
        });

        return generation;
      }

      // Check current period usage
      const periodMonth = getCurrentPeriodMonth();
      const { totalConsumed } = await this.getCurrentPeriodUsage(account._id, periodMonth);
      const remainingCredits = plan.monthlyAllowance - totalConsumed;

      if (totalCredits > remainingCredits) {
        const canUseOverage = plan.overageAllowed && account.overageEnabled;

        if (!canUseOverage) {
          logger.warn('Credit limit exhausted', {
            accountId,
            required: totalCredits,
            remaining: remainingCredits,
            totalConsumed,
            monthlyAllowance: plan.monthlyAllowance,
          });

          throw Errors.creditsExhaustedError(
            `Insufficient credits. Required: ${totalCredits}, remaining allowance: ${Math.max(0, remainingCredits)}.`
          );
        }
      }

      // 6. Create Generation in 'queued' state
      const generation = await Generation.create({
        accountId: account._id,
        apiKeyId: params.apiKeyId,
        idempotencyKey: params.idempotencyKey,
        prompt: params.prompt,
        durationSec,
        durationUnits,
        license,
        instrumental: params.instrumental,
        status: 'queued',
        creditsReserved: totalCredits,
        creditsCharged: 0,
        provider: params.provider,
        model: params.model,
        metadata: params.metadata,
        queuedAt: new Date(),
      });

      // 7. Write reservation entry into UsageLedger
      await UsageLedger.create({
        accountId: account._id,
        apiKeyId: params.apiKeyId,
        generationId: generation._id,
        eventType: 'reservation',
        credits: totalCredits,
        license,
        durationUnits,
        periodMonth,
        description: `Reserved ${totalCredits} credits for generation (${license}, ${durationSec}s)`,
      });

      return generation;
    } finally {
      await releaseLock();
    }
  }

  /**
   * Settles reserved credits upon successful generation completion.
   */
  static async settleGenerationSuccess(generationId: Types.ObjectId | string): Promise<void> {
    const gen = await Generation.findById(generationId);
    if (!gen || gen.status === 'succeeded') return;

    const reserved = gen.creditsReserved;
    const periodMonth = getCurrentPeriodMonth(gen.queuedAt);

    gen.status = 'succeeded';
    gen.creditsCharged = reserved;
    gen.completedAt = new Date();
    await gen.save();

    if (reserved > 0) {
      await UsageLedger.create({
        accountId: gen.accountId,
        apiKeyId: gen.apiKeyId,
        generationId: gen._id,
        eventType: 'charge',
        credits: reserved,
        license: gen.license,
        durationUnits: gen.durationUnits,
        periodMonth,
        description: `Settled charge of ${reserved} credits for generation ${gen._id}`,
      });
    }
  }

  /**
   * Releases reserved credits upon generation failure, provider timeout, or cancellation.
   */
  static async releaseGenerationReservation(
    generationId: Types.ObjectId | string,
    reasonStatus: 'failed' | 'canceled',
    errorDetails?: { code?: string; message?: string }
  ): Promise<void> {
    const gen = await Generation.findById(generationId);
    if (!gen || gen.status === 'succeeded' || gen.status === 'failed' || gen.status === 'canceled') {
      return;
    }

    const reserved = gen.creditsReserved;
    const periodMonth = getCurrentPeriodMonth(gen.queuedAt);

    gen.status = reasonStatus;
    gen.completedAt = new Date();
    if (errorDetails) {
      gen.error = errorDetails;
    }
    await gen.save();

    if (reserved > 0) {
      await UsageLedger.create({
        accountId: gen.accountId,
        apiKeyId: gen.apiKeyId,
        generationId: gen._id,
        eventType: 'refund',
        credits: reserved,
        license: gen.license,
        durationUnits: gen.durationUnits,
        periodMonth,
        description: `Refunded ${reserved} credits due to generation ${reasonStatus}`,
        metadata: errorDetails,
      });
    }

    logger.info('Released generation reservation and parallel slot', {
      generationId: gen._id,
      status: reasonStatus,
      refundedCredits: reserved,
    });
  }
}
