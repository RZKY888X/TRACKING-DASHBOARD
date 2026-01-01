const express = require("express");
const router = express.Router();
const controller = require("../controllers/gps.controller");

router.post("/gps/push", controller.pushGPS);

module.exports = router;
