const service = require("../services/order.service");

exports.createOrder = async (req, res) => {
  try {
    const { orderNumber, originId, destinationId } = req.body;
    if (!orderNumber || !originId || !destinationId)
      return res.status(400).json({ error: "Incomplete order data" });

    res.json(await service.createOrder({ orderNumber, originId, destinationId }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    res.json(await service.getOrders());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
