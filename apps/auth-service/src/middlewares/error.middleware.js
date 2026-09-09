import logger from '../utils/logger.util.js';
import { MESSAGES, sendError } from '@homeflow/common';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || MESSAGES.INTERNAL_SERVER_ERROR;

  if (statusCode === 500) {
    logger.error({ err, req }, 'Unhandled Exception');
  } else {
    logger.warn({ err, req }, 'Handled Error');
  }

  const payload = {
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  return res.status(statusCode).json({ success: false, ...payload });
};
