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
      select: { id: true, email: true, name: true, role: true }
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

export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
  }
  next();
};
