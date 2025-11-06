import { validationResult } from 'express-validator';
import * as categoryService from '../services/category.service.js';

export const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    const category = await categoryService.createCategory(name, req.user.companyId);

    res.status(201).json({ category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories(req.user.companyId);
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id, req.user.companyId);
    res.json({ category });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await categoryService.updateCategory(id, req.user.companyId, name);
    res.json({ category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id, req.user.companyId);
    res.json({ message: 'Категория удалена успешно.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
