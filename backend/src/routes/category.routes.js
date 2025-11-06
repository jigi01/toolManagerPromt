import express from 'express';
import { body } from 'express-validator';
import * as categoryController from '../controllers/category.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  requirePermission('TOOL_CREATE'),
  [
    body('name').trim().notEmpty().withMessage('Название категории обязательно.')
  ],
  categoryController.createCategory
);

router.get('/', protect, requirePermission('TOOL_READ'), categoryController.getCategories);
router.get('/:id', protect, requirePermission('TOOL_READ'), categoryController.getCategory);
router.put('/:id', protect, requirePermission('TOOL_UPDATE'), categoryController.updateCategory);
router.delete('/:id', protect, requirePermission('TOOL_DELETE'), categoryController.deleteCategory);

export default router;
