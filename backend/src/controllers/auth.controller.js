import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import * as authService from '../services/auth.service.js';
import { yandexAuthService } from '../services/oauth.service.js';

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, companyName, inviteToken } = req.body;

    const result = await authService.registerUser(name, email, password, companyName, inviteToken);

    if (result.requiresVerification) {
      return res.status(200).json({
        message: 'Код подтверждения отправлен на email.',
        requiresVerification: true,
        email: result.email
      });
    }

    // Fallback for OAuth or logic change (currently registerUser always returns verification needed for password flow)
    res.status(201).json({ message: 'Пользователь успешно зарегистрирован', user: result.user, token: result.token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email и код обязательны.' });
    }

    const { user, token } = await authService.verifyEmail(email, code);
    res.json({ message: 'Email подтвержден.', user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email обязателен.' });
    }

    await authService.resendVerificationCode(email);
    res.json({ message: 'Код отправлен повторно.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.loginUser(email, password);
    res.json({ token, user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const logout = (req, res) => {
  res.status(200).json({ message: 'Вышли из системы' });
};

export const getMe = async (req, res) => {
  try {
    // req.user is already populated by the protect middleware
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const registerOAuth = async (req, res) => {
  try {
    const { token, password, companyName, inviteToken, email } = req.body;
    const result = await authService.registerOAuthUser(token, password, companyName, inviteToken, email);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



export const yandexAuth = (req, res) => {
  const url = yandexAuthService.getAuthUrl();
  res.redirect(url);
};

export const yandexCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) throw new Error('No code provided');

    const result = await yandexAuthService.handleCallback(code);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (result.registerRequired) {
      const preAuthToken = jwt.sign(
        { ...result.profile, type: 'pre-auth' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      return res.redirect(`${frontendUrl}/complete-registration?token=${preAuthToken}`);
    }

    const { token } = result;
    res.redirect(`${frontendUrl}/login?token=${token}`);
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message)}`);
  }
};
