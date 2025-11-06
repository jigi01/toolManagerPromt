import express from 'express';
import { body } from 'express-validator';
import * as warehouseController from '../controllers/warehouse.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  requirePermission('WAREHOUSE_CREATE'),
  [
    body('name').trim().notEmpty().withMessage('Название склада обязательно.')
  ],
  warehouseController.createWarehouse
);

router.get('/', protect, requirePermission('WAREHOUSE_READ'), warehouseController.getWarehouses);
router.get('/:id', protect, requirePermission('WAREHOUSE_READ'), warehouseController.getWarehouse);
router.put('/:id', protect, requirePermission('WAREHOUSE_UPDATE'), warehouseController.updateWarehouse);
router.delete('/:id', protect, requirePermission('WAREHOUSE_DELETE'), warehouseController.deleteWarehouse);

export default router;
