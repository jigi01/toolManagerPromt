import { validationResult } from 'express-validator';
import * as warehouseService from '../services/warehouse.service.js';

export const createWarehouse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, isDefault } = req.body;
    const warehouse = await warehouseService.createWarehouse(
      name,
      req.user.companyId,
      isDefault
    );

    res.status(201).json({ warehouse });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await warehouseService.getAllWarehouses(req.user.companyId);
    res.json({ warehouses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await warehouseService.getWarehouseById(id, req.user.companyId);
    res.json({ warehouse });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const warehouse = await warehouseService.updateWarehouse(id, req.user.companyId, updates);
    res.json({ warehouse });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    await warehouseService.deleteWarehouse(id, req.user.companyId);
    res.json({ message: 'Склад удален успешно.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
