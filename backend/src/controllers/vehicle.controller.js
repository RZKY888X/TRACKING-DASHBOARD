const vehicleService = require("../services/vehicle.service");

exports.getVehicles = async (req, res) => {
  try {
    res.json(await vehicleService.getVehicles());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const { plate, type, deviceId } = req.body;
    if (!plate) return res.status(400).json({ error: "Plate required" });

    res.json(await vehicleService.createVehicle({ plate, type, deviceId }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
