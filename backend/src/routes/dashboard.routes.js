const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboard.controller");

router.get("/dashboard/map", controller.getMap);
router.get("/dashboard/active-trips", controller.getActiveTrips);
router.get("/dashboard/live-positions", controller.getLivePositions);
router.get("/dashboard/stats", controller.stats);
router.get("/dashboard/performance", controller.performance);
router.get("/dashboard/trip-status", controller.tripStatus);

module.exports = router;
