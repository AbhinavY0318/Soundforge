import { Types } from 'mongoose';
import { ApiKey, IApiKey, ApiKeyMode, ApiKeyScope } from '../models/ApiKey.js';
import { generateApiKey } from '../utils/crypto.js';
import { Errors } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export interface CreateApiKeyResult {
  apiKey: IApiKey;
  secret: string; // ONLY returned once at creation!
}

export class ApiKeyService {
  /**
   * Generates a new API key and returns the full secret once.
   */
  static async createApiKey(params: {
    accountId: Types.ObjectId | string;
    name: string;
    mode: ApiKeyMode;
    scopes?: ApiKeyScope[];
  }): Promise<CreateApiKeyResult> {
    const { accountId, name, mode, scopes = ['generations:write', 'generations:read'] } = params;

    const { fullKey, keyPrefix, hashedSecret } = generateApiKey(mode);

    const apiKey = await ApiKey.create({
      accountId: typeof accountId === 'string' ? new Types.ObjectId(accountId) : accountId,
      name,
      keyPrefix,
      hashedSecret,
      mode,
      scopes,
      status: 'active',
    });

    logger.info('Created new API key', {
      apiKeyId: apiKey._id,
      accountId,
      mode,
      keyPrefix,
    });

    return { apiKey, secret: fullKey };
  }

  /**
   * Retrieves keys for an account. Notice secret is NEVER returned.
   */
  static async listAccountKeys(accountId: Types.ObjectId | string): Promise<IApiKey[]> {
    return ApiKey.find({
      accountId: typeof accountId === 'string' ? new Types.ObjectId(accountId) : accountId,
    })
      .select('-hashedSecret') // Exclude hashed secret from listing
      .sort({ createdAt: -1 });
  }

  /**
   * Immediately revokes an API key.
   */
  static async revokeApiKey(apiKeyId: string, accountId: string): Promise<IApiKey> {
    const key = await ApiKey.findOne({ _id: apiKeyId, accountId });
    if (!key) {
      throw Errors.notFound('API Key');
    }

    key.status = 'revoked';
    await key.save();

    logger.info('API key revoked immediately', { apiKeyId, accountId, keyPrefix: key.keyPrefix });
    return key;
  }

  /**
   * Rotates an API key with a safe overlap period (e.g. 24 hours) or atomic replacement.
   * If overlapHours > 0:
   *   The existing key is marked as 'rotating' and will remain valid until rotatesAt (now + overlapHours).
   *   A new replacement key is created and its secret is returned once.
   * If overlapHours === 0:
   *   The existing key is atomically revoked immediately and a new key is returned.
   */
  static async rotateApiKey(params: {
    apiKeyId: string;
    accountId: string;
    overlapHours?: number;
  }): Promise<CreateApiKeyResult & { oldKey: IApiKey }> {
    const { apiKeyId, accountId, overlapHours = 24 } = params;

    const oldKey = await ApiKey.findOne({ _id: apiKeyId, accountId });
    if (!oldKey) {
      throw Errors.notFound('API Key');
    }

    if (oldKey.status === 'revoked') {
      throw Errors.badRequest('Cannot rotate a key that has already been revoked.');
    }

    // Configure old key status based on overlap strategy
    if (overlapHours > 0) {
      oldKey.status = 'rotating';
      oldKey.rotatesAt = new Date(Date.now() + overlapHours * 3600 * 1000);
    } else {
      oldKey.status = 'revoked';
    }
    await oldKey.save();

    // Create new key with same name, mode, and scopes
    const { apiKey: newKey, secret } = await this.createApiKey({
      accountId,
      name: `${oldKey.name} (Rotated)`,
      mode: oldKey.mode,
      scopes: oldKey.scopes,
    });

    logger.info('Rotated API key', {
      oldKeyId: oldKey._id,
      newKeyId: newKey._id,
      overlapHours,
      oldKeyRotatesAt: oldKey.rotatesAt,
    });

    return { apiKey: newKey, secret, oldKey };
  }
}
