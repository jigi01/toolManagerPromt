import prisma from '../utils/prisma.js';

export const assignToolToUser = async (toolId, toUserId, notes = null) => {
  const tool = await prisma.tool.findUnique({ where: { id: parseInt(toolId) } });

  if (!tool) {
    throw new Error('Инструмент не найден.');
  }

  if (tool.status !== 'AVAILABLE') {
    throw new Error('Инструмент недоступен для выдачи. Текущий статус: ' + tool.status);
  }

  const user = await prisma.user.findUnique({ where: { id: parseInt(toUserId) } });

  if (!user) {
    throw new Error('Пользователь не найден.');
  }

  const updatedTool = await prisma.$transaction(async (tx) => {
    const tool = await tx.tool.update({
      where: { id: parseInt(toolId) },
      data: {
        status: 'IN_USE',
        currentOwnerId: parseInt(toUserId)
      },
      include: {
        currentOwner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    await tx.toolHistory.create({
      data: {
        toolId: parseInt(toolId),
        fromUserId: null,
        toUserId: parseInt(toUserId),
        notes: notes || `Выдан со склада пользователю ${user.name}`
      }
    });

    return tool;
  });

  return updatedTool;
};

export const returnToolToWarehouse = async (toolId, currentUserId) => {
  const tool = await prisma.tool.findUnique({ 
    where: { id: parseInt(toolId) },
    include: { currentOwner: true }
  });

  if (!tool) {
    throw new Error('Инструмент не найден.');
  }

  if (tool.currentOwnerId !== currentUserId) {
    throw new Error('Вы не можете вернуть инструмент, который вам не принадлежит.');
  }

  const updatedTool = await prisma.$transaction(async (tx) => {
    const tool = await tx.tool.update({
      where: { id: parseInt(toolId) },
      data: {
        status: 'AVAILABLE',
        currentOwnerId: null
      }
    });

    await tx.toolHistory.create({
      data: {
        toolId: parseInt(toolId),
        fromUserId: currentUserId,
        toUserId: null,
        notes: `Возвращен на склад от ${tool.currentOwner?.name || 'пользователя'}`
      }
    });

    return tool;
  });

  return updatedTool;
};

export const transferToolBetweenUsers = async (toolId, fromUserId, toUserId, notes = null) => {
  const tool = await prisma.tool.findUnique({ 
    where: { id: parseInt(toolId) },
    include: { currentOwner: true }
  });

  if (!tool) {
    throw new Error('Инструмент не найден.');
  }

  if (tool.currentOwnerId !== fromUserId) {
    throw new Error('Вы не можете передать инструмент, который вам не принадлежит.');
  }

  const toUser = await prisma.user.findUnique({ where: { id: parseInt(toUserId) } });

  if (!toUser) {
    throw new Error('Получатель не найден.');
  }

  const updatedTool = await prisma.$transaction(async (tx) => {
    const tool = await tx.tool.update({
      where: { id: parseInt(toolId) },
      data: {
        currentOwnerId: parseInt(toUserId)
      },
      include: {
        currentOwner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    await tx.toolHistory.create({
      data: {
        toolId: parseInt(toolId),
        fromUserId: fromUserId,
        toUserId: parseInt(toUserId),
        notes: notes || `Передан от ${tool.currentOwner?.name || 'пользователя'} к ${toUser.name}`
      }
    });

    return tool;
  });

  return updatedTool;
};
