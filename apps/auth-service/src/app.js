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

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'auth-service' });
});

// Swagger UI
app.use('/homeSphere/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/auth', authRoutes);

// 404 Handler
app.use((req, res, next) => {
  next(createError(404, MESSAGES.NOT_FOUND('Route')));
});

// Global Error Handler
app.use(errorHandler);

export default app;
