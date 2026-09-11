import * as authService from '../services/auth.service.js';
import { sendSuccess } from '@homesphere/common';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    return sendSuccess(res, 201, undefined, result);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return sendSuccess(res, 200, undefined, result);
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    return sendSuccess(res, 200, undefined, result);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await authService.getProfile(userId);
    return sendSuccess(res, 200, undefined, profile);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Not Implemented' });
};

export const resetPassword = async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Not Implemented' });
};

export const verifyEmail = async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Not Implemented' });
};
