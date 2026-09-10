import app from './app.js';
import env from './config/env.js';
import { logger } from '@homeflow/common';
import prisma from './prisma/client.js';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(env.PORT, () => {
      logger.info(`🚀 Auth Service running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
