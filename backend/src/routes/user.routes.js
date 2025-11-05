import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, requirePermission('USER_READ'), userController.getUsers);
router.delete('/:id', protect, requirePermission('USER_DELETE'), userController.deleteUser);

export default router;
