import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export const registerUser = async (name, email, password) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    throw new Error('Пользователь с таким email уже существует.');
  }

  const userCount = await prisma.user.count();
  const role = userCount === 0 ? 'ADMIN' : 'EMPLOYEE';

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role
    },
    select: { id: true, email: true, name: true, role: true }
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return { user, token };
};

export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error('Неверный email или пароль.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Неверный email или пароль.');
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return { 
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token 
  };
};
