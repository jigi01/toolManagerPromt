import prisma from '../utils/prisma.js';

export const createTool = async (name, serialNumber, description) => {
  const existingTool = await prisma.tool.findUnique({ where: { serialNumber } });

  if (existingTool) {
    throw new Error('Инструмент с таким серийным номером уже существует.');
  }

  const tool = await prisma.tool.create({
    data: {
      name,
      serialNumber,
      description,
      status: 'AVAILABLE'
    }
  });

  return tool;
};

export const getAllTools = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.currentOwnerId) {
    where.currentOwnerId = parseInt(filters.currentOwnerId);
  }

  const tools = await prisma.tool.findMany({
    where,
    include: {
      currentOwner: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return tools;
};

export const getToolById = async (toolId) => {
  const tool = await prisma.tool.findUnique({
    where: { id: parseInt(toolId) },
    include: {
      currentOwner: {
        select: { id: true, name: true, email: true }
      },
      history: {
        include: {
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

  return tool;
};

export const updateTool = async (toolId, updates) => {
  const tool = await prisma.tool.update({
    where: { id: parseInt(toolId) },
    data: updates,
    include: {
      currentOwner: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  return tool;
};

export const deleteTool = async (toolId) => {
  await prisma.tool.delete({
    where: { id: parseInt(toolId) }
  });
};
