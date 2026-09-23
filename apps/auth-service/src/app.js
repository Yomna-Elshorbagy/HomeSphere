import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import logger from '@homesphere/logger';
import { errorHandler, MESSAGES } from '@homesphere/common';
import authRoutes from './routes/auth.routes.js';
import createError from 'http-errors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { randomUUID } from 'crypto';
import { cleanupExpiredTokens } from './cron/cleanup.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({
  logger,
  genReqId: (req, res) => {
    const id = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
}));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'auth-service' });
});

// Swagger UI
app.use('/api-docs/auth-service', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/auth', authRoutes);

// 404 Handler
app.use((req, res, next) => {
  next(createError(404, MESSAGES.NOT_FOUND('Route')));
});

// Global Error Handler
app.use(errorHandler);

// Start background cleanup cron job (runs every 24 hours).
// Safe for multi-instance deployments thanks to Redis Distributed Locks!
setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000);

export default app;
