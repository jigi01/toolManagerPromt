import { body } from 'express-validator';

export const register = [
    body('name').trim().notEmpty().withMessage('Имя обязательно.'),
    body('email').isEmail().withMessage('Некорректный email.'),
    body('password').isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов.')
];

export const login = [
    body('email').isEmail().withMessage('Некорректный email.'),
    body('password').exists().withMessage('Пароль обязателен.')
];
