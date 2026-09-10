import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger, errorHandler, MESSAGES } from '@homeflow/common';
import homeRoutes from './routes/home.routes.js';
import createError from 'http-errors';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(pinoHttp({ logger }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'home-service' });
});

// Routes
app.use('/homes', homeRoutes);

// 404 Handler
app.use((req, res, next) => {
  next(createError(404, MESSAGES.NOT_FOUND('Route')));
});

// Global Error Handler
app.use(errorHandler);

export default app;
