import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { getRedisClient } from './config/redis.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import developerRouter from './routes/developer/index.js';
import dashboardRouter from './routes/dashboard/index.js';
import { Errors } from './utils/errors.js';

export function createApp(): express.Application {
  const app = express();

  // Security headers with helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI to render smoothly
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        'Idempotency-Key',
        'X-Request-Id',
        'X-Refresh-Token',
      ],
    })
  );

  // Request ID middleware
  app.use(requestIdMiddleware);

  // Request logging in development/production (skip in test to keep logs clean)
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms (reqId: :res[x-request-id])'));
  }

  // Parse JSON payloads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ==========================================
  // Health & Readiness Probes
  // ==========================================
  app.get(['/health', '/healthz'], async (req, res) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    let redisStatus = 'disconnected';

    try {
      const redis = getRedisClient();
      redisStatus = redis.status === 'ready' ? 'connected' : redis.status;
    } catch {
      redisStatus = 'unavailable';
    }

    res.status(200).json({
      status: 'ok',
      service: 'soundforge-api',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoStatus,
        redis: redisStatus,
        music_provider: env.MUSIC_PROVIDER,
      },
    });
  });

  // ==========================================
  // OpenAPI Documentation / Swagger UI
  // ==========================================
  try {
    const openapiPath = path.resolve(process.cwd(), '../docs/openapi.yaml');
    const localOpenapiPath = path.resolve(process.cwd(), './docs/openapi.yaml');
    let swaggerDocument;

    try {
      swaggerDocument = YAML.load(openapiPath);
    } catch {
      swaggerDocument = YAML.load(localOpenapiPath);
    }

    if (swaggerDocument) {
      app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
      app.get('/docs/openapi.yaml', (req, res) => {
        res.sendFile(openapiPath);
      });
    }
  } catch {
    // Non-fatal if swagger file isn't loaded immediately
  }

  // ==========================================
  // API Routes
  // ==========================================
  // Developer REST API v1
  app.use('/v1', developerRouter);
  // Dashboard Management REST API v1
  app.use('/api/v1', dashboardRouter);

  // 404 Route Handler
  app.use((req, res, next) => {
    next(Errors.notFound(`Endpoint ${req.method} ${req.originalUrl}`));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
