import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Не авторизован. Токен отсутствует.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
            isBoss: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Не авторизован. Токен недействителен.' });
  }
};

// Middleware для проверки конкретного права
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Доступ запрещен.' });
    }

    const hasPermission = req.user.role.permissions.includes(permission);

    if (!hasPermission) {
      return res.status(403).json({ 
        error: `Доступ запрещен. Требуется право: ${permission}` 
      });
    }

    next();
  };
};

// Middleware для проверки нескольких прав (хотя бы одно)
export const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Доступ запрещен.' });
    }

    const hasAnyPermission = permissions.some(permission => 
      req.user.role.permissions.includes(permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({ 
        error: `Доступ запрещен. Требуется одно из прав: ${permissions.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware только для Босса
export const bossOnly = (req, res, next) => {
  if (!req.user || !req.user.role || !req.user.role.isBoss) {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права Босса.' });
  }
  next();
};

// Устаревший adminOnly для обратной совместимости
export const adminOnly = bossOnly;
