const express = require("express");
const router = express.Router();
const controller = require("../controllers/route.controller");

router.get("/routes", controller.getRoute);

module.exports = router;
