import crypto from 'crypto';

export function hashSha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

export function generateApiKey(mode: 'test' | 'live'): { fullKey: string; keyPrefix: string; hashedSecret: string } {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const fullKey = `sf_${mode}_${randomBytes}`;
  // Safe prefix displays the mode and the first 8 characters of the secret
  const keyPrefix = `sf_${mode}_${randomBytes.substring(0, 8)}...`;
  const hashedSecret = hashSha256(fullKey);

  return { fullKey, keyPrefix, hashedSecret };
}

export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function computeHmacSha256(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

export function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
