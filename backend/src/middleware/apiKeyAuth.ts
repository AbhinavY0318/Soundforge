import { Request, Response, NextFunction } from 'express';
import { ApiKey, IApiKey, ApiKeyScope } from '../models/ApiKey.js';
import { Account, IAccount } from '../models/Account.js';
import { Plan, IPlan } from '../models/Plan.js';
import { hashSha256 } from '../utils/crypto.js';
import { Errors } from '../utils/errors.js';

declare global {
  namespace Express {
    interface Request {
      apiKey?: IApiKey;
    }
  }
}

export function apiKeyAuth(requiredScope?: ApiKeyScope) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // API Key can be provided in Authorization: Bearer <key> or X-API-Key: <key>
      let rawKey: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        rawKey = authHeader.substring(7).trim();
      } else if (req.headers['x-api-key']) {
        rawKey = (req.headers['x-api-key'] as string).trim();
      }

      if (!rawKey) {
        throw Errors.unauthorized(
          'API key is missing. Provide your API key using the Authorization header (Bearer sf_...) or X-API-Key header.',
          'api_key_missing'
        );
      }

      if (!rawKey.startsWith('sf_test_') && !rawKey.startsWith('sf_live_')) {
        throw Errors.unauthorized('Invalid API key format. API keys must start with sf_test_ or sf_live_.', 'invalid_api_key_format');
      }

      // Compute SHA-256 hash of provided key to query database
      const hashedSecret = hashSha256(rawKey);

      const apiKey = await ApiKey.findOne({ hashedSecret });
      if (!apiKey) {
        throw Errors.unauthorized('Invalid API key. The provided key was not recognized.', 'invalid_api_key');
      }

      // Check key revocation status
      if (apiKey.status === 'revoked') {
        throw Errors.unauthorized('This API key has been revoked and cannot be used.', 'api_key_revoked');
      }

      // Handle rotating keys with overlap window
      if (apiKey.status === 'rotating') {
        if (apiKey.rotatesAt && new Date() > apiKey.rotatesAt) {
          apiKey.status = 'revoked';
          await apiKey.save();
          throw Errors.unauthorized('This rotating API key overlap period has expired and is now revoked.', 'api_key_expired');
        }
      }

      // Check explicit expiration
      if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
        throw Errors.unauthorized('This API key has expired.', 'api_key_expired');
      }

      // Verify scope if required
      if (requiredScope && !apiKey.scopes.includes(requiredScope)) {
        throw Errors.forbidden(
          `This API key does not have the required scope (${requiredScope}). Available scopes: ${apiKey.scopes.join(', ')}.`,
          'insufficient_scope'
        );
      }

      // Load associated account
      const account = await Account.findById(apiKey.accountId);
      if (!account) {
        throw Errors.unauthorized('The account associated with this API key no longer exists.', 'account_not_found');
      }

      if (account.status !== 'active') {
        throw Errors.forbidden(`Your account is currently ${account.status}. Access denied.`, 'account_inactive');
      }

      // Load plan
      const plan = await Plan.findById(account.planId);
      if (!plan) {
        throw Errors.internal('Account plan configuration is invalid.');
      }

      // Sandbox plan restriction: test keys only
      if (plan.allowTestKeysOnly && apiKey.mode === 'live') {
        throw Errors.forbidden(
          'Live API keys are not permitted on the Sandbox plan. Please upgrade to Starter or Growth to use live mode.',
          'live_mode_restricted'
        );
      }

      // Attach context to request
      req.apiKey = apiKey;
      req.account = account;
      req.plan = plan;

      // Update lastUsedAt asynchronously in the background
      ApiKey.updateOne({ _id: apiKey._id }, { $set: { lastUsedAt: new Date() } }).exec().catch(() => {});

      next();
    } catch (error) {
      next(error);
    }
  };
}
