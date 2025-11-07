import express from 'express';
import * as statsController from '../controllers/stats.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/company', protect, statsController.getCompanyStats);
router.get('/activity', protect, statsController.getActivityFeed);

export default router;
