const express = require("express");
const router = express.Router();
const controller = require("../controllers/order.controller");

router.post("/orders", controller.createOrder);
router.get("/orders", controller.getOrders);

module.exports = router;
