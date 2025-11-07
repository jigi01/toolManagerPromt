import * as statsService from '../services/stats.service.js';

export const getCompanyStats = async (req, res) => {
  try {
    const stats = await statsService.getCompanyStats(req.user.companyId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getActivityFeed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await statsService.getActivityFeed(req.user.companyId, limit);
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
