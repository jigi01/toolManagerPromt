import prisma from '../utils/prisma.js';

export const getRolesByCompany = async (companyId) => {
  return await prisma.role.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { users: true }
      }
    },
    orderBy: [
      { isBoss: 'desc' },
      { createdAt: 'asc' }
    ]
  });
};

export const createRole = async (name, companyId, permissions = []) => {
  const existingRole = await prisma.role.findUnique({
    where: {
      companyId_name: {
        companyId,
        name
      }
    }
  });

  if (existingRole) {
    throw new Error('Роль с таким именем уже существует в вашей компании.');
  }

  return await prisma.role.create({
    data: {
      name,
      companyId,
      permissions,
      isBoss: false
    }
  });
};

export const updateRole = async (roleId, companyId, name, permissions) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId }
  });

  if (!role) {
    throw new Error('Роль не найдена.');
  }

  if (role.companyId !== companyId) {
    throw new Error('Эта роль не принадлежит вашей компании.');
  }

  if (role.isBoss) {
    throw new Error('Нельзя редактировать роль Босса.');
  }

  return await prisma.role.update({
    where: { id: roleId },
    data: { name, permissions }
  });
};

export const deleteRole = async (roleId, companyId) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      _count: {
        select: { users: true }
      }
    }
  });

  if (!role) {
    throw new Error('Роль не найдена.');
  }

  if (role.companyId !== companyId) {
    throw new Error('Эта роль не принадлежит вашей компании.');
  }

  if (role.isBoss) {
    throw new Error('Нельзя удалить роль Босса.');
  }

  if (role._count.users > 0) {
    throw new Error('Нельзя удалить роль, к которой привязаны пользователи.');
  }

  await prisma.role.delete({
    where: { id: roleId }
  });
};

export const assignRoleToUser = async (userId, roleId, currentUserCompanyId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('Пользователь не найден.');
  }

  if (user.companyId !== currentUserCompanyId) {
    throw new Error('Этот пользователь не принадлежит вашей компании.');
  }

  const role = await prisma.role.findUnique({
    where: { id: roleId }
  });

  if (!role) {
    throw new Error('Роль не найдена.');
  }

  if (role.companyId !== currentUserCompanyId) {
    throw new Error('Эта роль не принадлежит вашей компании.');
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { roleId },
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
};
