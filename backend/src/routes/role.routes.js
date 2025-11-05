import express from 'express';
import * as roleController from '../controllers/role.controller.js';
import { protect, bossOnly, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, bossOnly, roleController.getRoles);
router.post('/', protect, bossOnly, roleController.createRole);
router.put('/:id', protect, bossOnly, roleController.updateRole);
router.delete('/:id', protect, bossOnly, roleController.deleteRole);

// Назначение роли пользователю
router.put('/assign/:userId', protect, requirePermission('USER_ASSIGN_ROLE'), roleController.assignRole);

export default router;
