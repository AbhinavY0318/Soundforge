import { connectDatabase } from './config/database.js';
import { createGenerationWorker } from './workers/generationWorker.js';
import { ensureBucketExists } from './config/minio.js';
import { logger } from './config/logger.js';

async function startWorker() {
  try {
    logger.info('Starting SoundForge Background Queue Worker...');
    await connectDatabase();
    await ensureBucketExists();

    const generationWorker = createGenerationWorker();
    logger.info('Generation worker successfully registered to "generation-jobs" queue');

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Closing queue workers...`);
      await generationWorker.close();
      logger.info('Workers closed. Exiting.');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error: any) {
    logger.error('Worker failed to start', { error: error.message });
    process.exit(1);
  }
}

startWorker();
