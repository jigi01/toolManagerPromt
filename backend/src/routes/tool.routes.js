import express from 'express';
import { body } from 'express-validator';
import * as toolController from '../controllers/tool.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  requirePermission('TOOL_CREATE'),
  [
    body('name').trim().notEmpty().withMessage('Название инструмента обязательно.'),
    body('serialNumber').trim().notEmpty().withMessage('Серийный номер обязателен.')
  ],
  toolController.createTool
);

router.get('/', protect, requirePermission('TOOL_READ'), toolController.getTools);
router.get('/:id', protect, requirePermission('TOOL_READ'), toolController.getTool);
router.put('/:id', protect, requirePermission('TOOL_UPDATE'), toolController.updateTool);
router.delete('/:id', protect, requirePermission('TOOL_DELETE'), toolController.deleteTool);

// Новые эндпоинты для передачи и приема
router.post('/:id/transfer', protect, requirePermission('TOOL_TRANSFER'), toolController.transferTool);
router.post('/:id/checkin', protect, requirePermission('TOOL_CHECKIN'), toolController.checkinTool);

export default router;
