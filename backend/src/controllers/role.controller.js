import * as roleService from '../services/role.service.js';

export const getRoles = async (req, res) => {
  try {
    const roles = await roleService.getRolesByCompany(req.user.companyId);
    res.json({ roles });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Необходимо указать имя и права роли.' });
    }

    const role = await roleService.createRole(name, req.user.companyId, permissions);
    res.status(201).json({ role });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    if (!name || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Необходимо указать имя и права роли.' });
    }

    const role = await roleService.updateRole(id, req.user.companyId, name, permissions);
    res.json({ role });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    await roleService.deleteRole(id, req.user.companyId);
    res.json({ message: 'Роль успешно удалена.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const assignRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ error: 'Необходимо указать ID роли.' });
    }

    const user = await roleService.assignRoleToUser(userId, roleId, req.user.companyId);
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
