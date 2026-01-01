const service = require("../services/dashboard.service");

const getMap = async (req, res) => {
  try {
    res.json(await service.getMapData());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getActiveTrips = async (req, res) => {
  try {
    res.json(await service.getActiveTrips());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getLivePositions = async (req, res) => {
  try {
    res.json(await service.getLivePositions());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const stats = async (req, res) => {
  try {
    res.json(await service.getDashboardStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const performance = async (req, res) => {
  try {
    res.json(await service.getPerformance(req.query.range));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const tripStatus = async (req, res) => {
  try {
    res.json(await service.getTripStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMap,
  getActiveTrips,
  getLivePositions,
  stats,
  performance,
  tripStatus
};
