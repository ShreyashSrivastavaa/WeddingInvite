import { createServer } from './server';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './db/prisma';

const app = createServer();

// In non-serverless local environments, listen on env.PORT
if (!process.env.VERCEL) {
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 RSVP Wedding Manager API running at http://localhost:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received: closing HTTP server and database connections...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await prisma.$disconnect();
      logger.info('Database disconnected.');
      process.exit(0);
    });

    // Force shutdown if taking longer than 10s
    setTimeout(() => {
      logger.error('Forceful shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export default app;
