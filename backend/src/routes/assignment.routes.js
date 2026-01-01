const express = require("express");
const router = express.Router();
const controller = require("../controllers/assignment.controller");

router.post("/assignments", controller.createAssignment);
router.get("/assignments", controller.getAssignments);

module.exports = router;
