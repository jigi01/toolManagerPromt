import * as transferService from '../services/transfer.service.js';

export const assignTool = async (req, res) => {
  try {
    const { toolId, toUserId, notes } = req.body;

    if (!toolId || !toUserId) {
      return res.status(400).json({ error: 'toolId и toUserId обязательны.' });
    }

    const tool = await transferService.assignToolToUser(toolId, toUserId, notes);
    res.json({ tool, message: 'Инструмент успешно выдан.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const returnTool = async (req, res) => {
  try {
    const { toolId } = req.body;

    if (!toolId) {
      return res.status(400).json({ error: 'toolId обязателен.' });
    }

    const tool = await transferService.returnToolToWarehouse(toolId, req.user.id);
    res.json({ tool, message: 'Инструмент успешно возвращен на склад.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const transferTool = async (req, res) => {
  try {
    const { toolId, toUserId, notes } = req.body;

    if (!toolId || !toUserId) {
      return res.status(400).json({ error: 'toolId и toUserId обязательны.' });
    }

    const tool = await transferService.transferToolBetweenUsers(
      toolId, 
      req.user.id, 
      toUserId, 
      notes
    );
    res.json({ tool, message: 'Инструмент успешно передан.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
