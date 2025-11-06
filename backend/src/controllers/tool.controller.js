import { validationResult } from 'express-validator';
import * as toolService from '../services/tool.service.js';

export const createTool = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, serialNumber, description, imageUrl, warehouseId, price, categoryId } = req.body;
    const tool = await toolService.createTool(
      name,
      serialNumber,
      description,
      req.user.companyId,
      imageUrl,
      warehouseId,
      price,
      categoryId
    );

    res.status(201).json({ tool });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getTools = async (req, res) => {
  try {
    const { status, currentUserId, warehouseId, categoryId } = req.query;
    const tools = await toolService.getAllTools(req.user.companyId, { status, currentUserId, warehouseId, categoryId });

    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTool = async (req, res) => {
  try {
    const { id } = req.params;
    const tool = await toolService.getToolById(id, req.user.companyId);

    res.json({ tool });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const updateTool = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tool = await toolService.updateTool(id, req.user.companyId, updates);
    res.json({ tool });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTool = async (req, res) => {
  try {
    const { id } = req.params;
    await toolService.deleteTool(id, req.user.companyId);

    res.json({ message: 'Инструмент удален успешно.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const transferTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { toUserId, toWarehouseId } = req.body;

    if (!toUserId && !toWarehouseId) {
      return res.status(400).json({ error: 'Необходимо указать ID получателя или ID склада.' });
    }

    const tool = await toolService.transferTool(
      id,
      toUserId,
      req.user.id,
      req.user.companyId,
      toWarehouseId
    );

    res.json({ tool });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const checkinTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouseId } = req.body;

    const tool = await toolService.checkinTool(
      id,
      req.user.id,
      req.user.companyId,
      warehouseId
    );

    res.json({ tool });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
