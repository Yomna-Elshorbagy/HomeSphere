import app from './app.js';
import { env } from './config/env.js';
import logger from '@homesphere/logger';
import prisma from './prisma/client.js';

const PORT = env.PORT || 3001;

await prisma.$connect();
console.log('✅ Database connected successfully');

const server = app.listen(PORT, () => {
  logger.info(`🏠 Home Service is running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  logger.error(err, 'Unhandled Rejection. Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
