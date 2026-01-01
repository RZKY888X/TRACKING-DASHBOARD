const service = require("../services/warehouse.service");

exports.getWarehouses = async (req, res) => {
  try {
    res.json(await service.getWarehouses());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    const { name, city, latitude, longitude } = req.body;
    if (!name || !city || latitude == null || longitude == null)
      return res.status(400).json({ error: "Incomplete warehouse data" });

    res.json(await service.createWarehouse({ name, city, latitude, longitude }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
