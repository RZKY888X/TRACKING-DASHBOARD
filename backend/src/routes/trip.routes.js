const express = require("express");
const router = express.Router();
const controller = require("../controllers/trip.controller");

router.post("/trips/start", controller.startTrip);
router.post("/trips/end", controller.endTrip);

module.exports = router;
