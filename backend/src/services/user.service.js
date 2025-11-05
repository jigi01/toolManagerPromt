import prisma from '../utils/prisma.js';

export const getAllUsers = async (companyId) => {
  const users = await prisma.user.findMany({
    where: { companyId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      role: {
        select: {
          id: true,
          name: true,
          permissions: true,
          isBoss: true
        }
      },
      _count: {
        select: { currentTools: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return users;
};

export const deleteUser = async (userId, companyId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true
    }
  });

  if (!user) {
    throw new Error('Пользователь не найден.');
  }

  if (user.companyId !== companyId) {
    throw new Error('Этот пользователь не принадлежит вашей компании.');
  }

  if (user.role && user.role.isBoss) {
    throw new Error('Нельзя удалить пользователя с ролью Босса.');
  }

  await prisma.user.delete({
    where: { id: userId }
  });
};
