const activityService = require("../services/activity.service");

exports.getActivities = async (req, res) => {
  try {
    const result = await activityService.getActivities(req);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const log = await activityService.getActivityById(req);
    res.json(log);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
