const express = require("express");
const router = express.Router();
const controller = require("../controllers/warehouse.controller");

router.get("/warehouses", controller.getWarehouses);
router.post("/warehouses", controller.createWarehouse);

module.exports = router;
