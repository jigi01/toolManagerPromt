import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Имя обязательно.'),
    body('email').isEmail().withMessage('Некорректный email.'),
    body('password').isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов.')
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Некорректный email.'),
    body('password').notEmpty().withMessage('Пароль обязателен.')
  ],
  authController.login
);

router.post('/logout', authController.logout);

router.get('/me', protect, authController.getMe);

export default router;
