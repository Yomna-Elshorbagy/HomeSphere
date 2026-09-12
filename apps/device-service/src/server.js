import { env } from './config/env.js';
import app from './app.js';
import logger from '@homesphere/logger';
import prisma from './prisma/client.js';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(env.PORT, () => {
      logger.info(`🚀 Device Service running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
