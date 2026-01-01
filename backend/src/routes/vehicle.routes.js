const express = require("express");
const router = express.Router();
const controller = require("../controllers/vehicle.controller");

router.get("/vehicles", controller.getVehicles);
router.post("/vehicles", controller.createVehicle);

module.exports = router;
