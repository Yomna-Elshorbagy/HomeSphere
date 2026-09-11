import createError from 'http-errors';
import { verifyAccessToken } from '../utils/jwt.util.js';
import { MESSAGES } from '@homesphere/common';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError(401, MESSAGES.UNAUTHORIZED_NO_TOKEN));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return next(createError(401, MESSAGES.UNAUTHORIZED_INVALID_TOKEN));
  }

  req.user = decoded;
  next();
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, MESSAGES.UNAUTHORIZED_NO_TOKEN));
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return next(createError(403, MESSAGES.FORBIDDEN));
    }
    
    next();
  };
};
