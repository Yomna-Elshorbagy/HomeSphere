import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.util.js';

const startServer = () => {
  try {
    app.listen(env.PORT, () => {
      logger.info(`🚀 Auth Service running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
