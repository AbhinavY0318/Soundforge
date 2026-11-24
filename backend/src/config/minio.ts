import * as Minio from 'minio';
import { env } from './env.js';
import { logger } from './logger.js';

let minioClient: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }
  return minioClient;
}

export async function ensureBucketExists(): Promise<void> {
  try {
    const client = getMinioClient();
    const exists = await client.bucketExists(env.MINIO_BUCKET_NAME);
    if (!exists) {
      await client.makeBucket(env.MINIO_BUCKET_NAME, 'us-east-1');
      logger.info('Created MinIO bucket', { bucket: env.MINIO_BUCKET_NAME });
    }
  } catch (err: unknown) {
    const error = err as Error;
    logger.warn('Could not ensure MinIO bucket exists (MinIO may still be starting up)', {
      error: error.message,
    });
  }
}
