const service = require("../services/trip.service");

exports.startTrip = async (req, res) => {
  try {
    const assignmentId = parseInt(req.body.assignmentId);
    if (isNaN(assignmentId))
      return res.status(400).json({ error: "Invalid assignment id" });

    res.json(await service.startTrip(assignmentId));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.endTrip = async (req, res) => {
  try {
    const { tripId, destinationId, avgSpeed } = req.body;
    await service.endTrip({
      tripId: parseInt(tripId),
      destinationId,
      avgSpeed
    });

    res.json({ message: "Trip completed successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
