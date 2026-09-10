import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator.js';
import { validate, authenticate } from '@homeflow/common';

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

router.get('/me', authenticate, authController.getProfile);

export default router;
