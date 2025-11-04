import * as userService from '../services/user.service.js';

export const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Роль обязательна.' });
    }

    const user = await userService.updateUserRole(id, role);
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
