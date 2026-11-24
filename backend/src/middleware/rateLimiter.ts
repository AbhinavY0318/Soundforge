import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../config/logger.js';

// In-memory fallback map for test environments where Redis is not connected
const inMemoryCounters = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Must be called after apiKeyAuth or dashboardAuth
      const account = req.account;
      const plan = req.plan;

      if (!account || !plan) {
        // If no authenticated context yet, proceed
        return next();
      }

      const accountId = account._id.toString();
      const now = Math.floor(Date.now() / 1000);
      const hourWindowSeconds = 3600;
      const hourKey = `ratelimit:hour:${accountId}:${Math.floor(now / hourWindowSeconds)}`;
      const maxPerHour = plan.requestsPerHour;

      let currentUsage = 0;
      let windowReset = (Math.floor(now / hourWindowSeconds) + 1) * hourWindowSeconds;

      try {
        const redis = getRedisClient();
        if (redis.status === 'ready') {
          const multi = redis.multi();
          multi.incr(hourKey);
          multi.expire(hourKey, hourWindowSeconds * 2);
          const results = await multi.exec();
          if (results && results[0] && !results[0][0]) {
            currentUsage = results[0][1] as number;
          }
        } else {
          throw new Error('Redis not ready, use in-memory fallback');
        }
      } catch {
        // In-memory fallback
        const record = inMemoryCounters.get(hourKey);
        if (!record || now > record.resetAt) {
          inMemoryCounters.set(hourKey, { count: 1, resetAt: windowReset });
          currentUsage = 1;
        } else {
          record.count += 1;
          currentUsage = record.count;
        }
      }

      const remaining = Math.max(0, maxPerHour - currentUsage);

      // Set standard rate limit headers
      res.setHeader('X-RateLimit-Limit', maxPerHour);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', windowReset);

      if (currentUsage > maxPerHour) {
        const retryAfterSeconds = Math.max(1, windowReset - now);
        res.setHeader('Retry-After', retryAfterSeconds);
        logger.warn('Rate limit exceeded for account', {
          accountId,
          plan: plan.name,
          currentUsage,
          limit: maxPerHour,
        });

        throw Errors.rateLimitError(
          `Hourly request rate limit of ${maxPerHour} requests exceeded. Try again in ${retryAfterSeconds} seconds.`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
