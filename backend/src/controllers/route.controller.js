const service = require("../services/route.service");

exports.getRoute = async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const result = await service.getRoutePolyline({
      originLat,
      originLng,
      destLat,
      destLng
    });

    res.json(result);
  } catch (err) {
    if (err.message === "Route not found") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};
