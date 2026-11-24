import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiKeyService } from '../../services/apiKeyService.js';
import { ApiKeyMode, ApiKeyScope } from '../../models/ApiKey.js';

const createKeySchema = z.object({
  name: z.string().min(1, 'Key name is required').max(50),
  mode: z.enum(['test', 'live']).default('test'),
  scopes: z.array(z.enum(['generations:write', 'generations:read'])).default([
    'generations:write',
    'generations:read',
  ]),
});

const rotateKeySchema = z.object({
  overlapHours: z.coerce.number().min(0).max(720).default(24),
});

export class DashboardApiKeyController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const plan = req.plan!;
      const body = createKeySchema.parse(req.body);

      // Enforce Sandbox plan test keys only
      if (plan.allowTestKeysOnly && body.mode === 'live') {
        res.status(403).json({
          error: {
            type: 'permission_error',
            code: 'live_mode_restricted',
            message: 'Live API keys are not available on the Sandbox plan. Please upgrade to Starter or Growth.',
          },
        });
        return;
      }

      const { apiKey, secret } = await ApiKeyService.createApiKey({
        accountId: account._id,
        name: body.name,
        mode: body.mode as ApiKeyMode,
        scopes: body.scopes as ApiKeyScope[],
      });

      res.status(201).json({
        key: {
          id: apiKey._id.toString(),
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          mode: apiKey.mode,
          scopes: apiKey.scopes,
          status: apiKey.status,
          createdAt: apiKey.createdAt.toISOString(),
          lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
        },
        secret, // Displayed ONLY once here!
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const keys = await ApiKeyService.listAccountKeys(account._id);

      res.status(200).json({
        keys: keys.map((k) => ({
          id: k._id.toString(),
          name: k.name,
          keyPrefix: k.keyPrefix,
          mode: k.mode,
          scopes: k.scopes,
          status: k.status,
          createdAt: k.createdAt.toISOString(),
          rotatesAt: k.rotatesAt?.toISOString() || null,
          lastUsedAt: k.lastUsedAt?.toISOString() || null,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const { id } = req.params;

      const apiKey = await ApiKeyService.revokeApiKey(id, account._id.toString());

      res.status(200).json({
        message: 'API key revoked successfully.',
        key: {
          id: apiKey._id.toString(),
          keyPrefix: apiKey.keyPrefix,
          status: apiKey.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async rotate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = req.account!;
      const { id } = req.params;
      const { overlapHours } = rotateKeySchema.parse(req.body);

      const { apiKey: newKey, secret, oldKey } = await ApiKeyService.rotateApiKey({
        apiKeyId: id,
        accountId: account._id.toString(),
        overlapHours,
      });

      res.status(200).json({
        message: `API key rotated. Old key remains active for ${overlapHours} hours.`,
        oldKey: {
          id: oldKey._id.toString(),
          status: oldKey.status,
          rotatesAt: oldKey.rotatesAt?.toISOString() || null,
        },
        newKey: {
          id: newKey._id.toString(),
          name: newKey.name,
          keyPrefix: newKey.keyPrefix,
          mode: newKey.mode,
          scopes: newKey.scopes,
          status: newKey.status,
          createdAt: newKey.createdAt.toISOString(),
        },
        secret, // Displayed ONLY once here!
      });
    } catch (error) {
      next(error);
    }
  }
}
