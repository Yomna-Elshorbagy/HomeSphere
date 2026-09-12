import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import pinoHttp from 'pino-http';
import logger from '@homesphere/logger';
import { authenticate } from '@homesphere/auth';
import { errorHandler, MESSAGES } from '@homesphere/common';
import createError from 'http-errors';
import { randomUUID } from 'crypto';

const app = express();

// Global Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins for now
  credentials: true,
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  }
});
app.use(globalLimiter);

// Logging
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

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API Gateway is healthy' });
});

// --- Proxies ---
// Auth Service Proxy (Public)
app.use('/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '/auth'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying request to auth-service: ${req.method} ${req.url}`);
    if (req.id) proxyReq.setHeader('x-request-id', req.id);
  }
}));

// Home Service Proxy (Protected)
// We apply the `authenticate` middleware here so invalid JWTs are rejected immediately!
app.use('/homes', authenticate, createProxyMiddleware({
  target: process.env.HOME_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/homes': '/homes'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying request to home-service: ${req.method} ${req.url}`);
    
    if (req.id) proxyReq.setHeader('x-request-id', req.id);
    
    // Inject user ID header if decoded from JWT, for the microservice to optionally use
    if (req.user) {
      proxyReq.setHeader('x-user-id', req.user.id);
    }
  }
}));

// Device Service Proxy (Protected)
app.use('/devices', authenticate, createProxyMiddleware({
  target: process.env.DEVICE_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/devices': '/devices'
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying request to device-service: ${req.method} ${req.url}`);
    if (req.id) proxyReq.setHeader('x-request-id', req.id);
    if (req.user) proxyReq.setHeader('x-user-id', req.user.id);
  }
}));

// 404 Handler
app.use((req, res, next) => {
  next(createError(404, MESSAGES.NOT_FOUND));
});

// Global Error Handler
app.use(errorHandler);

export default app;
