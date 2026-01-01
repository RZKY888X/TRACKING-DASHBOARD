const express = require("express");
const router = express.Router();
const controller = require("../controllers/tripFilter.controller");
const { authMiddleware } = require("../../middleware/auth");

router.get("/api/filter/cascade-options", authMiddleware, controller.getCascadeOptions);
router.get("/api/trips/filter", authMiddleware, controller.filterTrips);

module.exports = router;
