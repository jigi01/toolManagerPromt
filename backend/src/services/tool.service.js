import prisma from '../utils/prisma.js';

export const createTool = async (name, serialNumber, description, companyId, imageUrl = null, warehouseId = null, price = null, categoryId = null) => {
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

  // Если warehouseId не указан, используем дефолтный склад
  let targetWarehouseId = warehouseId;
  if (!targetWarehouseId) {
    const defaultWarehouse = await prisma.warehouse.findFirst({
      where: { companyId, isDefault: true }
    });
    
    if (defaultWarehouse) {
      targetWarehouseId = defaultWarehouse.id;
    }
  }

  // Проверяем, что склад существует и принадлежит компании
  if (targetWarehouseId) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: targetWarehouseId }
    });

    if (!warehouse) {
      throw new Error('Указанный склад не найден.');
    }

    if (warehouse.companyId !== companyId) {
      throw new Error('Указанный склад не принадлежит вашей компании.');
    }
  }

  // Проверяем, что категория существует и принадлежит компании
  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new Error('Указанная категория не найдена.');
    }

    if (category.companyId !== companyId) {
      throw new Error('Указанная категория не принадлежит вашей компании.');
    }
  }

  const tool = await prisma.tool.create({
    data: {
      name,
      serialNumber,
      description,
      imageUrl,
      price,
      categoryId,
      companyId,
      warehouseId: targetWarehouseId,
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

  if (filters.warehouseId) {
    where.warehouseId = filters.warehouseId;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  const tools = await prisma.tool.findMany({
    where,
    include: {
      currentUser: {
        select: { id: true, name: true, email: true }
      },
      warehouse: {
        select: { id: true, name: true }
      },
      category: {
        select: { id: true, name: true }
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
      warehouse: {
        select: { id: true, name: true }
      },
      category: {
        select: { id: true, name: true }
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
          },
          fromWarehouse: {
            select: { id: true, name: true }
          },
          toWarehouse: {
            select: { id: true, name: true }
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

  // Проверяем, что категория существует и принадлежит компании
  if (updates.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: updates.categoryId }
    });

    if (!category) {
      throw new Error('Указанная категория не найдена.');
    }

    if (category.companyId !== companyId) {
      throw new Error('Указанная категория не принадлежит вашей компании.');
    }
  }

  const updatedTool = await prisma.tool.update({
    where: { id: toolId },
    data: updates,
    include: {
      currentUser: {
        select: { id: true, name: true, email: true }
      },
      warehouse: {
        select: { id: true, name: true }
      },
      category: {
        select: { id: true, name: true }
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

// Передача инструмента от одного пользователя другому (или со склада пользователю, или на склад)
export const transferTool = async (toolId, toUserId, actorId, companyId, toWarehouseId = null) => {
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

    // Должен быть указан либо toUserId, либо toWarehouseId
    if (!toUserId && !toWarehouseId) {
      throw new Error('Необходимо указать получателя или склад назначения.');
    }

    // Нельзя передать и пользователю и на склад одновременно
    if (toUserId && toWarehouseId) {
      throw new Error('Нельзя передать инструмент одновременно пользователю и на склад.');
    }

    const fromUserId = tool.currentUserId;
    const fromWarehouseId = tool.warehouseId;

    let updatedData = {};

    // Если передаем пользователю
    if (toUserId) {
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

      updatedData = {
        currentUserId: toUserId,
        warehouseId: null,
        status: 'IN_USE'
      };
    }

    // Если передаем на склад
    if (toWarehouseId) {
      // Проверяем, что склад существует и принадлежит компании
      const toWarehouse = await tx.warehouse.findUnique({
        where: { id: toWarehouseId }
      });

      if (!toWarehouse) {
        throw new Error('Целевой склад не найден.');
      }

      if (toWarehouse.companyId !== companyId) {
        throw new Error('Целевой склад не принадлежит вашей компании.');
      }

      updatedData = {
        currentUserId: null,
        warehouseId: toWarehouseId,
        status: 'AVAILABLE'
      };
    }

    // Обновляем инструмент
    const updatedTool = await tx.tool.update({
      where: { id: toolId },
      data: updatedData,
      include: {
        currentUser: {
          select: { id: true, name: true, email: true }
        },
        warehouse: {
          select: { id: true, name: true }
        },
        category: {
          select: { id: true, name: true }
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
        toUserId: toUserId || null,
        fromWarehouseId,
        toWarehouseId: toWarehouseId || null
      }
    });

    return updatedTool;
  });
};

// Возврат инструмента на склад
export const checkinTool = async (toolId, actorId, companyId, warehouseId = null) => {
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

    // Если склад не указан, используем дефолтный
    let targetWarehouseId = warehouseId;
    if (!targetWarehouseId) {
      const defaultWarehouse = await tx.warehouse.findFirst({
        where: { companyId, isDefault: true }
      });
      
      if (defaultWarehouse) {
        targetWarehouseId = defaultWarehouse.id;
      }
    }

    // Проверяем, что склад существует и принадлежит компании
    if (targetWarehouseId) {
      const warehouse = await tx.warehouse.findUnique({
        where: { id: targetWarehouseId }
      });

      if (!warehouse) {
        throw new Error('Указанный склад не найден.');
      }

      if (warehouse.companyId !== companyId) {
        throw new Error('Указанный склад не принадлежит вашей компании.');
      }
    }

    // Обновляем инструмент
    const updatedTool = await tx.tool.update({
      where: { id: toolId },
      data: {
        currentUserId: null,
        warehouseId: targetWarehouseId,
        status: 'AVAILABLE'
      },
      include: {
        currentUser: {
          select: { id: true, name: true, email: true }
        },
        warehouse: {
          select: { id: true, name: true }
        },
        category: {
          select: { id: true, name: true }
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
        toUserId: null,
        fromWarehouseId: null,
        toWarehouseId: targetWarehouseId
      }
    });

    return updatedTool;
  });
};
