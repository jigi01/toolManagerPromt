import crypto from 'crypto';
import prisma from '../utils/prisma.js';

export const createInvitation = async (email, companyId, roleId = null, expiresInDays = 7) => {
  // Проверяем, что пользователь с таким email еще не существует
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('Пользователь с таким email уже зарегистрирован.');
  }

  // Проверяем, нет ли неиспользованного приглашения для этого email
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      email,
      companyId,
      usedAt: null,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (existingInvitation) {
    return existingInvitation;
  }

  // Если указана роль, проверяем, что она принадлежит компании
  if (roleId) {
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role || role.companyId !== companyId) {
      throw new Error('Указанная роль не принадлежит вашей компании.');
    }
  }

  // Генерируем уникальный токен
  const token = crypto.randomBytes(32).toString('hex');

  // Устанавливаем срок действия
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Создаем приглашение
  return await prisma.invitation.create({
    data: {
      token,
      email,
      companyId,
      roleId,
      expiresAt
    }
  });
};

export const getInvitationsByCompany = async (companyId) => {
  return await prisma.invitation.findMany({
    where: { companyId },
    include: {
      role: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const deleteInvitation = async (invitationId, companyId) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId }
  });

  if (!invitation) {
    throw new Error('Приглашение не найдено.');
  }

  if (invitation.companyId !== companyId) {
    throw new Error('Это приглашение не принадлежит вашей компании.');
  }

  await prisma.invitation.delete({
    where: { id: invitationId }
  });
};

export const getInvitationByToken = async (token) => {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      company: true,
      role: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!invitation) {
    throw new Error('Приглашение не найдено.');
  }

  if (invitation.usedAt) {
    throw new Error('Это приглашение уже использовано.');
  }

  if (new Date() > invitation.expiresAt) {
    throw new Error('Срок действия приглашения истек.');
  }

  return invitation;
};
