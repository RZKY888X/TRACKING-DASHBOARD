const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../../middleware/auth");
const activityController = require("../controllers/activity.controller");

// LIST ACTIVITY LOGS
router.get("/", authMiddleware, activityController.getActivities);

// ACTIVITY DETAIL
router.get("/:id", authMiddleware, activityController.getActivityById);

module.exports = router;
