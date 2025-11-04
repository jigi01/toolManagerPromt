import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, userController.getUsers);
router.put('/role/:id', protect, adminOnly, userController.updateRole);

export default router;
