import 'dotenv/config';
import app from './app.js';
import logger from '@homesphere/logger';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`🚀 API Gateway is running on port ${PORT}`);
      logger.info(`🛡️  Rate limiting and CORS enabled globally`);
    });
  } catch (error) {
    logger.fatal(error, 'Failed to start API Gateway');
    process.exit(1);
  }
};

startServer();
