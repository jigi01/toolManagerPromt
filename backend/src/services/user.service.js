import prisma from '../utils/prisma.js';

export const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: {
        select: { toolsOwned: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return users;
};

export const updateUserRole = async (userId, newRole) => {
  if (!['ADMIN', 'EMPLOYEE'].includes(newRole)) {
    throw new Error('Недопустимая роль.');
  }

  const user = await prisma.user.update({
    where: { id: parseInt(userId) },
    data: { role: newRole },
    select: { id: true, email: true, name: true, role: true }
  });

  return user;
};
