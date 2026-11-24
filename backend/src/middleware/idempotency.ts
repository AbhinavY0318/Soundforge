import { Request, Response, NextFunction } from 'express';
import { IdempotencyRecord, IIdempotencyRecord } from '../models/IdempotencyRecord.js';
import { hashSha256 } from '../utils/crypto.js';
import { Errors } from '../utils/errors.js';

export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalizeJson(obj[k])).join(',') + '}';
}

declare global {
  namespace Express {
    interface Request {
      idempotencyRecord?: IIdempotencyRecord;
      idempotencyKey?: string;
    }
  }
}

export function idempotencyMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

      // Only apply if Idempotency-Key header is supplied on POST/PUT requests
      if (!idempotencyKey) {
        return next();
      }

      const account = req.account;
      if (!account) {
        return next();
      }

      req.idempotencyKey = idempotencyKey;
      const requestHash = hashSha256(canonicalizeJson(req.body));
      const requestPath = req.baseUrl + req.path;

      // Check if an idempotency record already exists
      const existing = await IdempotencyRecord.findOne({
        accountId: account._id,
        idempotencyKey,
      });

      if (existing) {
        // Acceptance Test 7: Reusing an idempotency key with a different body returns 409
        if (existing.requestHash !== requestHash) {
          throw Errors.idempotencyConflict(
            `Idempotency-Key "${idempotencyKey}" was previously used with a different request payload.`
          );
        }

        // Acceptance Test 6: Same key + same payload
        if (existing.status === 'completed' && existing.responseBody) {
          res.setHeader('Idempotent-Replay', 'true');
          res.status(existing.responseStatus || 200).json(existing.responseBody);
          return;
        }

        if (existing.status === 'processing') {
          // If another concurrent request is currently in flight for this exact key & body,
          // wait up to 3 seconds for it to finish, or return 409 in-flight
          for (let i = 0; i < 15; i++) {
            await new Promise((r) => setTimeout(r, 200));
            const poll = await IdempotencyRecord.findById(existing._id);
            if (poll && poll.status === 'completed' && poll.responseBody) {
              res.setHeader('Idempotent-Replay', 'true');
              res.status(poll.responseStatus || 200).json(poll.responseBody);
              return;
            }
          }

          throw Errors.idempotencyConflict(
            `A request with Idempotency-Key "${idempotencyKey}" is currently being processed.`
          );
        }
      }

      // Atomically create the 'processing' record using upsert with condition or try-catch on duplicate key
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL

      try {
        const record = await IdempotencyRecord.create({
          accountId: account._id,
          idempotencyKey,
          requestPath,
          requestHash,
          status: 'processing',
          expiresAt,
        });
        req.idempotencyRecord = record;
      } catch (err: any) {
        if (err.code === 11000) {
          // Concurrent race won by another request
          const conflicting = await IdempotencyRecord.findOne({
            accountId: account._id,
            idempotencyKey,
          });

          if (conflicting && conflicting.requestHash !== requestHash) {
            throw Errors.idempotencyConflict(
              `Idempotency-Key "${idempotencyKey}" was previously used with a different request payload.`
            );
          }

          if (conflicting && conflicting.status === 'completed' && conflicting.responseBody) {
            res.setHeader('Idempotent-Replay', 'true');
            res.status(conflicting.responseStatus || 200).json(conflicting.responseBody);
            return;
          }

          throw Errors.idempotencyConflict(
            `A concurrent request with Idempotency-Key "${idempotencyKey}" is in flight.`
          );
        }
        throw err;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
