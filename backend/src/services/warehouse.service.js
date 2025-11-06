import prisma from '../utils/prisma.js';

// Создание склада
export const createWarehouse = async (name, companyId, isDefault = false) => {
  // Проверяем уникальность имени склада в рамках компании
  const existingWarehouse = await prisma.warehouse.findUnique({
    where: {
      companyId_name: {
        companyId,
        name
      }
    }
  });

  if (existingWarehouse) {
    throw new Error('Склад с таким названием уже существует в вашей компании.');
  }

  // Если создается дефолтный склад, снимаем флаг с остальных
  if (isDefault) {
    await prisma.warehouse.updateMany({
      where: { companyId, isDefault: true },
      data: { isDefault: false }
    });
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      name,
      companyId,
      isDefault
    }
  });

  return warehouse;
};

// Получение всех складов компании
export const getAllWarehouses = async (companyId) => {
  const warehouses = await prisma.warehouse.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { tools: true }
      }
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'asc' }
    ]
  });

  return warehouses;
};

// Получение склада по ID
export const getWarehouseById = async (warehouseId, companyId) => {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
    include: {
      tools: {
        include: {
          currentUser: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      _count: {
        select: { tools: true }
      }
    }
  });

  if (!warehouse) {
    throw new Error('Склад не найден.');
  }

  if (warehouse.companyId !== companyId) {
    throw new Error('Этот склад не принадлежит вашей компании.');
  }

  return warehouse;
};

// Обновление склада
export const updateWarehouse = async (warehouseId, companyId, updates) => {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId }
  });

  if (!warehouse) {
    throw new Error('Склад не найден.');
  }

  if (warehouse.companyId !== companyId) {
    throw new Error('Этот склад не принадлежит вашей компании.');
  }

  // Если делаем склад дефолтным, снимаем флаг с остальных
  if (updates.isDefault === true) {
    await prisma.warehouse.updateMany({
      where: { 
        companyId, 
        isDefault: true,
        id: { not: warehouseId }
      },
      data: { isDefault: false }
    });
  }

  const updatedWarehouse = await prisma.warehouse.update({
    where: { id: warehouseId },
    data: updates,
    include: {
      _count: {
        select: { tools: true }
      }
    }
  });

  return updatedWarehouse;
};

// Удаление склада
export const deleteWarehouse = async (warehouseId, companyId) => {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
    include: {
      _count: {
        select: { tools: true }
      }
    }
  });

  if (!warehouse) {
    throw new Error('Склад не найден.');
  }

  if (warehouse.companyId !== companyId) {
    throw new Error('Этот склад не принадлежит вашей компании.');
  }

  // Нельзя удалить дефолтный склад
  if (warehouse.isDefault) {
    throw new Error('Нельзя удалить дефолтный склад.');
  }

  // Проверяем, что на складе нет инструментов
  if (warehouse._count.tools > 0) {
    throw new Error('Нельзя удалить склад, на котором есть инструменты.');
  }

  await prisma.warehouse.delete({
    where: { id: warehouseId }
  });
};

// Получить дефолтный склад компании
export const getDefaultWarehouse = async (companyId) => {
  const warehouse = await prisma.warehouse.findFirst({
    where: { 
      companyId,
      isDefault: true
    }
  });

  if (!warehouse) {
    throw new Error('Дефолтный склад не найден.');
  }

  return warehouse;
};

// Создать дефолтный склад для компании (используется при регистрации)
export const createDefaultWarehouse = async (companyId) => {
  const existingDefault = await prisma.warehouse.findFirst({
    where: { 
      companyId,
      isDefault: true
    }
  });

  if (existingDefault) {
    return existingDefault;
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      name: 'Основной склад',
      companyId,
      isDefault: true
    }
  });

  return warehouse;
};
