import express from 'express';
import * as invitationController from '../controllers/invitation.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, requirePermission('USER_INVITE'), invitationController.createInvitation);
router.get('/', protect, requirePermission('USER_INVITE'), invitationController.getInvitations);
router.delete('/:id', protect, requirePermission('USER_INVITE'), invitationController.deleteInvitation);

// Публичный эндпоинт для получения информации о приглашении
router.get('/public/:token', invitationController.getInvitationInfo);

export default router;
