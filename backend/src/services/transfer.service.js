import prisma from '../utils/prisma.js';

export const assignToolToUser = async (toolId, toUserId, actorId, companyId, notes = null) => {
  const tool = await prisma.tool.findUnique({ where: { id: toolId } });

  if (!tool) {
    throw new Error('Инструмент не найден.');
  }

  if (tool.companyId !== companyId) {
    throw new Error('Этот инструмент не принадлежит вашей компании.');
  }

  if (tool.status !== 'AVAILABLE') {
    throw new Error('Инструмент недоступен для выдачи. Текущий статус: ' + tool.status);
  }

  const user = await prisma.user.findUnique({ where: { id: toUserId } });

  if (!user) {
    throw new Error('Пользователь не найден.');
  }

  if (user.companyId !== companyId) {
    throw new Error('Этот пользователь не принадлежит вашей компании.');
  }

  const updatedTool = await prisma.$transaction(async (tx) => {
    const tool = await tx.tool.update({
      where: { id: toolId },
      data: {
        status: 'IN_USE',
        currentUserId: toUserId
      },
      include: {
        currentUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    await tx.toolHistory.create({
      data: {
        toolId: toolId,
        actorId: actorId,
        action: 'TRANSFER',
        fromUserId: null,
        toUserId: toUserId,
        notes: notes || `Выдан со склада пользователю ${user.name}`
      }
    });

    return tool;
  });

  return updatedTool;
};

export const returnToolToWarehouse = async (toolId, currentUserId, companyId) => {
  const tool = await prisma.tool.findUnique({ 
    where: { id: toolId },
    include: { currentUser: true }
  });

  if (!tool) {
    throw new Error('Инструмент не найден.');
  }

  if (tool.companyId !== companyId) {
    throw new Error('Этот инструмент не принадлежит вашей компании.');
  }

  if (tool.currentUserId !== currentUserId) {
    throw new Error('Вы не можете вернуть инструмент, который вам не принадлежит.');
  }

  const updatedTool = await prisma.$transaction(async (tx) => {
    const tool = await tx.tool.update({
      where: { id: toolId },
      data: {
        status: 'AVAILABLE',
        currentUserId: null
      }
    });

    await tx.toolHistory.create({
      data: {
        toolId: toolId,
        actorId: currentUserId,
        action: 'CHECK_IN',
        fromUserId: currentUserId,
        toUserId: null,
        notes: `Возвращен на склад от ${tool.currentUser?.name || 'пользователя'}`
      }
    });

    return tool;
  });

  return updatedTool;
};

export const transferToolBetweenUsers = async (toolId, fromUserId, toUserId, companyId, notes = null) => {
  const tool = await prisma.tool.findUnique({ 
    where: { id: toolId },
    include: { currentUser: true }
  });

  if (!tool) {
    throw new Error('Инструмент не найден.');
  }

  if (tool.companyId !== companyId) {
    throw new Error('Этот инструмент не принадлежит вашей компании.');
  }

  if (tool.currentUserId !== fromUserId) {
    throw new Error('Вы не можете передать инструмент, который вам не принадлежит.');
  }

  const toUser = await prisma.user.findUnique({ where: { id: toUserId } });

  if (!toUser) {
    throw new Error('Получатель не найден.');
  }

  if (toUser.companyId !== companyId) {
    throw new Error('Получатель не принадлежит вашей компании.');
  }

  const updatedTool = await prisma.$transaction(async (tx) => {
    const tool = await tx.tool.update({
      where: { id: toolId },
      data: {
        currentUserId: toUserId,
        status: 'IN_USE'
      },
      include: {
        currentUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    await tx.toolHistory.create({
      data: {
        toolId: toolId,
        actorId: fromUserId,
        action: 'TRANSFER',
        fromUserId: fromUserId,
        toUserId: toUserId,
        notes: notes || `Передан от ${tool.currentUser?.name || 'пользователя'} к ${toUser.name}`
      }
    });

    return tool;
  });

  return updatedTool;
};
