import express from 'express';
import { body } from 'express-validator';
import * as toolController from '../controllers/tool.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  requirePermission('TOOL_CREATE'),
  upload.single('image'),
  [
    body('name').trim().notEmpty().withMessage('Название инструмента обязательно.'),
    body('serialNumber').trim().notEmpty().withMessage('Серийный номер обязателен.')
  ],
  toolController.createTool
);

router.get('/', protect, requirePermission('TOOL_READ'), toolController.getTools);
router.get('/my', protect, toolController.getMyTools);
router.get('/:id', protect, requirePermission('TOOL_READ'), toolController.getTool);
router.put('/:id', protect, requirePermission('TOOL_UPDATE'), upload.single('image'), toolController.updateTool);
router.delete('/:id', protect, requirePermission('TOOL_DELETE'), toolController.deleteTool);

// Новые эндпоинты для передачи и приема
router.post('/bulk-transfer', protect, requirePermission('TOOL_TRANSFER'), toolController.transferToolsBulk);
router.post('/bulk-checkin', protect, requirePermission('TOOL_CHECKIN'), toolController.checkinToolsBulk);

router.post('/:id/transfer', protect, requirePermission('TOOL_TRANSFER'), toolController.transferTool);
router.post('/:id/checkin', protect, requirePermission('TOOL_CHECKIN'), toolController.checkinTool);

export default router;
