import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

// Все возможные права доступа
const ALL_PERMISSIONS = [
  'USER_INVITE',
  'USER_DELETE',
  'USER_READ',
  'USER_ASSIGN_ROLE',
  'ROLE_MANAGE',
  'TOOL_CREATE',
  'TOOL_UPDATE',
  'TOOL_DELETE',
  'TOOL_READ',
  'TOOL_TRANSFER',
  'TOOL_CHECKIN'
];

export const registerUser = async (name, email, password, companyName = null, inviteToken = null) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    throw new Error('Пользователь с таким email уже существует.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let user;

  // Если есть токен приглашения - регистрируемся в существующую компанию
  if (inviteToken) {
    const invitation = await prisma.invitation.findUnique({
      where: { token: inviteToken },
      include: { company: true }
    });

    if (!invitation) {
      throw new Error('Неверный токен приглашения.');
    }

    if (invitation.usedAt) {
      throw new Error('Токен приглашения уже использован.');
    }

    if (new Date() > invitation.expiresAt) {
      throw new Error('Срок действия приглашения истек.');
    }

    if (invitation.email !== email) {
      throw new Error('Email не совпадает с приглашением.');
    }

    // Создаем пользователя в компании
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          companyId: invitation.companyId,
          roleId: invitation.roleId
        },
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

      // Помечаем приглашение как использованное
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() }
      });

      return newUser;
    });
  } else {
    // Регистрация новой компании
    if (!companyName) {
      throw new Error('Необходимо указать название компании.');
    }

    // Создаем компанию, роль Босса и первого пользователя
    user = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName }
      });

      const bossRole = await tx.role.create({
        data: {
          name: 'Босс',
          companyId: company.id,
          isBoss: true,
          permissions: ALL_PERMISSIONS
        }
      });

      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          companyId: company.id,
          roleId: bossRole.id
        },
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

      return newUser;
    });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return { user, token };
};

export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
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
    throw new Error('Неверный email или пароль.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Неверный email или пароль.');
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return { 
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
      role: user.role
    },
    token 
  };
};
