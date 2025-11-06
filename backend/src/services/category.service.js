import prisma from '../utils/prisma.js';

export const createCategory = async (name, companyId) => {
  const existingCategory = await prisma.category.findUnique({
    where: {
      name_companyId: {
        name,
        companyId
      }
    }
  });

  if (existingCategory) {
    throw new Error('Категория с таким названием уже существует в вашей компании.');
  }

  const category = await prisma.category.create({
    data: {
      name,
      companyId
    }
  });

  return category;
};

export const getAllCategories = async (companyId) => {
  const categories = await prisma.category.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { tools: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return categories;
};

export const getCategoryById = async (categoryId, companyId) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { tools: true }
      }
    }
  });

  if (!category) {
    throw new Error('Категория не найдена.');
  }

  if (category.companyId !== companyId) {
    throw new Error('Эта категория не принадлежит вашей компании.');
  }

  return category;
};

export const updateCategory = async (categoryId, companyId, name) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  });

  if (!category) {
    throw new Error('Категория не найдена.');
  }

  if (category.companyId !== companyId) {
    throw new Error('Эта категория не принадлежит вашей компании.');
  }

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: { name }
  });

  return updatedCategory;
};

export const deleteCategory = async (categoryId, companyId) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  });

  if (!category) {
    throw new Error('Категория не найдена.');
  }

  if (category.companyId !== companyId) {
    throw new Error('Эта категория не принадлежит вашей компании.');
  }

  await prisma.category.delete({
    where: { id: categoryId }
  });
};
