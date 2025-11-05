import * as invitationService from '../services/invitation.service.js';

export const createInvitation = async (req, res) => {
  try {
    const { email, roleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Необходимо указать email.' });
    }

    const invitation = await invitationService.createInvitation(
      email,
      req.user.companyId,
      roleId || null
    );

    res.status(201).json({ invitation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getInvitations = async (req, res) => {
  try {
    const invitations = await invitationService.getInvitationsByCompany(req.user.companyId);
    res.json({ invitations });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    await invitationService.deleteInvitation(id, req.user.companyId);
    res.json({ message: 'Приглашение успешно удалено.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getInvitationInfo = async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await invitationService.getInvitationByToken(token);
    res.json({ invitation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
