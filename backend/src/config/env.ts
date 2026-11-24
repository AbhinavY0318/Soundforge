import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or backend directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/soundforge?replicaSet=rs0&directConnection=true'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  JWT_ACCESS_SECRET: z.string().default('soundforge_super_secure_access_secret_change_in_production_32chars'),
  JWT_REFRESH_SECRET: z.string().default('soundforge_super_secure_refresh_secret_change_in_production_32chars'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET_NAME: z.string().default('soundforge-audio'),
  MINIO_PUBLIC_URL: z.string().default('http://localhost:9000'),
  MUSIC_PROVIDER: z.enum(['mock', 'elevenlabs', 'minimax']).default('mock'),
  ELEVENLABS_API_KEY: z.string().optional().default(''),
  ELEVENLABS_MODEL_ID: z.string().default('music_v1'),
  MINIMAX_API_KEY: z.string().optional().default(''),
  MOCK_PROVIDER_LATENCY_MS: z.coerce.number().default(1500),
  MOCK_PROVIDER_FAILURE_RATE: z.coerce.number().default(0.0),
  MOCK_PROVIDER_TIMEOUT_MS: z.coerce.number().default(30000),
  EMAIL_SERVICE_PROVIDER: z.enum(['mock', 'smtp']).default('mock'),
  SMTP_HOST: z.string().optional().default('smtp.mailtrap.io'),
  SMTP_PORT: z.coerce.number().optional().default(2525),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('SoundForge Support <no-reply@soundforge.ai>'),
  APP_BASE_URL: z.string().default('http://localhost:5173'),
  WEBHOOK_TIMEOUT_MS: z.coerce.number().default(10000),
  WEBHOOK_MAX_RETRIES: z.coerce.number().default(5),
});

export const env = envSchema.parse(process.env);
export type EnvConfig = z.infer<typeof envSchema>;
