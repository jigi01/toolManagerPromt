import * as userService from '../services/user.service.js';

export const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers(req.user.companyId);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id, req.user.companyId);
    res.json({ message: 'Пользователь успешно удален.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
