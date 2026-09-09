import createError from 'http-errors';
import crypto from 'crypto';
import * as authRepo from '../repositories/auth.repository.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { MESSAGES, AccountStatus } from '@homeflow/common';

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const register = async (name, email, password) => {
  const existingUser = await authRepo.findUserByEmail(email);
  if (existingUser) {
    throw createError(409, MESSAGES.ALREADY_IN_USE('Email'));
  }

  const hashedPassword = await hashPassword(password);
  
  const user = await authRepo.createUser({
    name,
    email,
    passwordHash: hashedPassword,
  });

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 
  await authRepo.createRefreshToken(user.id, hashedRefreshToken, expiresAt);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const login = async (email, password) => {
  const user = await authRepo.findUserByEmail(email);
  if (!user || user.status !== AccountStatus.ACTIVE) {
    throw createError(401, MESSAGES.INVALID_CREDENTIALS);
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw createError(401, MESSAGES.INVALID_CREDENTIALS);
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 
  await authRepo.createRefreshToken(user.id, hashedRefreshToken, expiresAt);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const refresh = async (token) => {
  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    throw createError(401, MESSAGES.UNAUTHORIZED_INVALID_TOKEN);
  }

  const hashedToken = hashToken(token);
  const storedToken = await authRepo.findRefreshToken(hashedToken);

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    throw createError(401, MESSAGES.UNAUTHORIZED_INVALID_TOKEN);
  }

  const user = storedToken.user;
  if (user.status !== AccountStatus.ACTIVE) {
    throw createError(401, MESSAGES.FORBIDDEN);
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const newAccessToken = signAccessToken(payload);

  return {
    accessToken: newAccessToken,
  };
};

export const logout = async (token) => {
  if (!token) return;
  const hashedToken = hashToken(token);
  await authRepo.revokeRefreshToken(hashedToken).catch(() => {});
};

export const getProfile = async (userId) => {
  const user = await authRepo.findUserById(userId);
  if (!user) throw createError(404, MESSAGES.NOT_FOUND('User'));
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
};
