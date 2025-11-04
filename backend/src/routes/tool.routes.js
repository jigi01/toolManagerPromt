import express from 'express';
import { body } from 'express-validator';
import * as toolController from '../controllers/tool.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Название инструмента обязательно.'),
    body('serialNumber').trim().notEmpty().withMessage('Серийный номер обязателен.')
  ],
  toolController.createTool
);

router.get('/', protect, toolController.getTools);
router.get('/:id', protect, toolController.getTool);
router.put('/:id', protect, adminOnly, toolController.updateTool);
router.delete('/:id', protect, adminOnly, toolController.deleteTool);

export default router;
