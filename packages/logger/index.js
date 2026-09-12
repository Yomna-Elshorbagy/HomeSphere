import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'refreshToken', 'accessToken'],
    censor: '[REDACTED]',
  },
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
});

export default logger;
