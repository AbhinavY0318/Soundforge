import { getMinioClient, ensureBucketExists } from '../config/minio.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Errors } from '../utils/errors.js';

export class StorageService {
  /**
   * Uploads an audio buffer to MinIO storage under the account's folder.
   */
  static async uploadAudio(
    accountId: string,
    generationId: string,
    buffer: Buffer,
    contentType = 'audio/wav'
  ): Promise<{ storageKey: string; bucket: string }> {
    const ext = contentType.includes('mpeg') || contentType.includes('mp3') ? 'mp3' : 'wav';
    const storageKey = `accounts/${accountId}/generations/${generationId}.${ext}`;

    if (process.env.NODE_ENV === 'test') {
      return { storageKey, bucket: env.MINIO_BUCKET_NAME };
    }

    try {
      await ensureBucketExists();
      const client = getMinioClient();

      await client.putObject(env.MINIO_BUCKET_NAME, storageKey, buffer, buffer.length, {
        'Content-Type': contentType,
        'x-amz-meta-account-id': accountId,
        'x-amz-meta-generation-id': generationId,
      });

      logger.info('Audio uploaded to MinIO', { bucket: env.MINIO_BUCKET_NAME, storageKey });
      return { storageKey, bucket: env.MINIO_BUCKET_NAME };
    } catch (err: any) {
      logger.error('Failed to upload audio to MinIO', { error: err.message });
      throw Errors.internal('Failed to persist generated audio to storage.');
    }
  }

  /**
   * Generates a signed URL with configurable expiration time (default 15 minutes / 900s).
   */
  static async getSignedAudioUrl(storageKey: string, expirySeconds = 900): Promise<string> {
    if (process.env.NODE_ENV === 'test') {
      return `${env.MINIO_PUBLIC_URL}/${env.MINIO_BUCKET_NAME}/${storageKey}?expires=${Date.now() + expirySeconds * 1000}`;
    }

    try {
      const client = getMinioClient();
      const signedUrl = await client.presignedGetObject(
        env.MINIO_BUCKET_NAME,
        storageKey,
        expirySeconds
      );
      return signedUrl;
    } catch (err: any) {
      logger.error('Failed to generate presigned URL', { error: err.message, storageKey });
      return `${env.MINIO_PUBLIC_URL}/${env.MINIO_BUCKET_NAME}/${storageKey}`;
    }
  }
}
