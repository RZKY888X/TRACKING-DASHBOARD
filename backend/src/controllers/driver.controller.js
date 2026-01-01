const driverService = require("../services/driver.service");

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await driverService.getDrivers();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDriver = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ error: "Driver name required" });

    const driver = await driverService.createDriver({ name, phone });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
