import { validationResult } from 'express-validator';
import * as toolService from '../services/tool.service.js';

export const createTool = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, serialNumber, description } = req.body;
    const tool = await toolService.createTool(name, serialNumber, description);

    res.status(201).json({ tool });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getTools = async (req, res) => {
  try {
    const { status, currentOwnerId } = req.query;
    const tools = await toolService.getAllTools({ status, currentOwnerId });

    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTool = async (req, res) => {
  try {
    const { id } = req.params;
    const tool = await toolService.getToolById(id);

    res.json({ tool });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const updateTool = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tool = await toolService.updateTool(id, updates);
    res.json({ tool });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteTool = async (req, res) => {
  try {
    const { id } = req.params;
    await toolService.deleteTool(id);

    res.json({ message: 'Инструмент удален успешно.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
