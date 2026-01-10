import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import * as authValidator from '../validators/auth.validator.js';

const router = express.Router();

router.post('/register', authValidator.register, authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-code', authController.resendVerificationCode);
router.post('/login', authValidator.login, authController.login);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

// OAuth Routes
router.get('/yandex', authController.yandexAuth);
router.get('/yandex/callback', authController.yandexCallback);
router.post('/oauth/register', authController.registerOAuth);

export default router;
