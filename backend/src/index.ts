import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { PlanService } from './services/planService.js';
import { ensureBucketExists } from './config/minio.js';
import { logger } from './config/logger.js';
import { createGenerationWorker } from './workers/generationWorker.js';

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Ensure subscription plans exist in MongoDB
    await PlanService.seedPlans();

    // Ensure MinIO bucket exists
    await ensureBucketExists();

    // Start background BullMQ generation worker in-process
    const generationWorker = createGenerationWorker();
    logger.info('Generation worker successfully registered to "generation-jobs" queue');

    const app = createApp();
    const server = app.listen(env.PORT, () => {
      logger.info(`SoundForge API Server running on port ${env.PORT} in ${env.NODE_ENV} mode`, {
        port: env.PORT,
        docs: `http://localhost:${env.PORT}/docs`,
      });
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      await generationWorker.close();
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error: any) {
    logger.error('Failed to start SoundForge API server', { error: error.message });
    process.exit(1);
  }
}

startServer();
