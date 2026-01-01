const service = require("../services/gps.service");

exports.pushGPS = async (req, res) => {
  try {
    const position = await service.pushGPS({
      vehicleId: parseInt(req.body.vehicleId),
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      speed: req.body.speed
    });

    res.json(position);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
