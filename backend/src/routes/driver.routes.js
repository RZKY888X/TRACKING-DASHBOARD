const express = require("express");
const router = express.Router();
const controller = require("../controllers/driver.controller");

router.get("/drivers", controller.getDrivers);
router.post("/drivers", controller.createDriver);

module.exports = router;
