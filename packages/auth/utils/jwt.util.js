import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const getEnv = (key, defaultValue) => process.env[key] || defaultValue;

export const signAccessToken = (payload) => {
  return jwt.sign(payload, getEnv('JWT_ACCESS_SECRET', 'secret'), {
    expiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
    jwtid: crypto.randomUUID(),
  });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, getEnv('JWT_REFRESH_SECRET', 'refresh_secret'), {
    expiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
    jwtid: crypto.randomUUID(),
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, getEnv('JWT_ACCESS_SECRET', 'secret'));
  } catch (err) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, getEnv('JWT_REFRESH_SECRET', 'refresh_secret'));
  } catch (err) {
    return null;
  }
};
