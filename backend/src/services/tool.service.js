import prisma from '../utils/prisma.js';

export const createTool = async (name, serialNumber, description, companyId, imageUrl = null) => {
  const existingTool = await prisma.tool.findUnique({
    where: {
      companyId_serialNumber: {
        companyId,
        serialNumber
      }
    }
  });

  if (existingTool) {
    throw new Error('Инструмент с таким серийным номером уже существует в вашей компании.');
  }

  const tool = await prisma.tool.create({
    data: {
      name,
      serialNumber,
      description,
      imageUrl,
      companyId,
      status: 'AVAILABLE'
    }
  });

  return tool;
};

export const getAllTools = async (companyId, filters = {}) => {
  const where = { companyId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.currentUserId) {
    where.currentUserId = filters.currentUserId;
  }

  const tools = await prisma.tool.findMany({
    where,
    include: {
      currentUser: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return tools;
};

export const getToolById = async (toolId, companyId) => {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    include: {
      currentUser: {
        select: { id: true, name: true, email: true }
      },
      history: {
        include: {
          actor: {
            select: { id: true, name: true, email: true }
          },
          fromUser: {
            select: { id: true, name: true, email: true }
          },
          toUser: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { timestamp: 'desc' }
      }
    }
  });

  if (!tool) {
    throw new Error('Инструмент не найден.');
  }

  if (tool.companyId !== companyId) {
    throw new Error('Этот инструмент не принадлежит вашей компании.');
  }

  return tool;
};

export const updateTool = async (toolId, companyId, updates) => {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId }
  });

  if (!tool) {
    throw new Error('Инструмент не найден.');
  }

  if (tool.companyId !== companyId) {
    throw new Error('Этот инструмент не принадлежит вашей компании.');
  }

  const updatedTool = await prisma.tool.update({
    where: { id: toolId },
    data: updates,
    include: {
      currentUser: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  return updatedTool;
};

export const deleteTool = async (toolId, companyId) => {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId }
  });

  if (!tool) {
    throw new Error('Инструмент не найден.');
  }

  if (tool.companyId !== companyId) {
    throw new Error('Этот инструмент не принадлежит вашей компании.');
  }

  await prisma.tool.delete({
    where: { id: toolId }
  });
};

// Передача инструмента от одного пользователя другому (или со склада пользователю)
export const transferTool = async (toolId, toUserId, actorId, companyId) => {
  return await prisma.$transaction(async (tx) => {
    // Получаем инструмент
    const tool = await tx.tool.findUnique({
      where: { id: toolId }
    });

    if (!tool) {
      throw new Error('Инструмент не найден.');
    }

    if (tool.companyId !== companyId) {
      throw new Error('Этот инструмент не принадлежит вашей компании.');
    }

    // Проверяем, что целевой пользователь существует и из той же компании
    const toUser = await tx.user.findUnique({
      where: { id: toUserId }
    });

    if (!toUser) {
      throw new Error('Целевой пользователь не найден.');
    }

    if (toUser.companyId !== companyId) {
      throw new Error('Целевой пользователь не принадлежит вашей компании.');
    }

    const fromUserId = tool.currentUserId;

    // Обновляем инструмент
    const updatedTool = await tx.tool.update({
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

    // Создаем запись в истории
    await tx.toolHistory.create({
      data: {
        toolId,
        actorId,
        action: 'TRANSFER',
        fromUserId,
        toUserId
      }
    });

    return updatedTool;
  });
};

// Возврат инструмента на склад
export const checkinTool = async (toolId, actorId, companyId) => {
  return await prisma.$transaction(async (tx) => {
    // Получаем инструмент
    const tool = await tx.tool.findUnique({
      where: { id: toolId }
    });

    if (!tool) {
      throw new Error('Инструмент не найден.');
    }

    if (tool.companyId !== companyId) {
      throw new Error('Этот инструмент не принадлежит вашей компании.');
    }

    if (!tool.currentUserId) {
      throw new Error('Инструмент уже находится на складе.');
    }

    const fromUserId = tool.currentUserId;

    // Обновляем инструмент
    const updatedTool = await tx.tool.update({
      where: { id: toolId },
      data: {
        currentUserId: null,
        status: 'AVAILABLE'
      },
      include: {
        currentUser: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Создаем запись в истории
    await tx.toolHistory.create({
      data: {
        toolId,
        actorId,
        action: 'CHECK_IN',
        fromUserId,
        toUserId: null
      }
    });

    return updatedTool;
  });
};
