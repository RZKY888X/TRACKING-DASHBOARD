const service = require("../services/assignment.service");

const createAssignment = async (req, res) => {
  try {
    const driverId = parseInt(req.body.driverId);
    const vehicleId = parseInt(req.body.vehicleId);
    const originId = parseInt(req.body.originId);
    const destinationId = parseInt(req.body.destinationId);

    if ([driverId, vehicleId, originId, destinationId].some(isNaN)) {
      return res.status(400).json({ error: "Invalid assignment data" });
    }

    const assignment = await service.createAssignment({
      driverId,
      vehicleId,
      originId,
      destinationId
    });

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAssignments = async (req, res) => {
  try {
    res.json(await service.getAssignments());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createAssignment,
  getAssignments
};
