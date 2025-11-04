import express from 'express';
import * as transferController from '../controllers/transfer.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/assign', protect, adminOnly, transferController.assignTool);
router.post('/return', protect, transferController.returnTool);
router.post('/user-to-user', protect, transferController.transferTool);

export default router;
