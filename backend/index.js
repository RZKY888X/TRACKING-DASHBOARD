// ======================================================
// backend/index.js
// Main Backend Entry Point
// ======================================================

// ---------- ENV ----------
require("dotenv").config();

// ---------- CORE ----------
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// ---------- DATABASE ----------
const prisma = require("./src/lib/prisma");

// ---------- MQTT ----------
const initMQTT = require("./src/mqtt/mqttClient");

// ---------- ROUTES ----------
const authRoutes = require("./src/routes/auth.routes");
const activityRoutes = require("./src/routes/activity.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const tripFilterRoutes = require("./src/routes/tripFilter.routes");

const driverRoutes = require("./src/routes/driver.routes");
const vehicleRoutes = require("./src/routes/vehicle.routes");
const warehouseRoutes = require("./src/routes/warehouse.routes");
const orderRoutes = require("./src/routes/order.routes");
const assignmentRoutes = require("./src/routes/assignment.routes");
const tripRoutes = require("./src/routes/trip.routes");
const gpsRoutes = require("./src/routes/gps.routes");
const routeRoutes = require("./src/routes/route.routes");

// ======================================================
// INIT APP
// ======================================================
const app = express();
const PORT = process.env.PORT || 3001;

// ======================================================
// GLOBAL MIDDLEWARE
// ======================================================
app.set("trust proxy", true);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

// ======================================================
// INIT SERVICES
// ======================================================
initMQTT();

// ======================================================
// API ROUTES
// ======================================================
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api", dashboardRoutes);
app.use("/api/trips", tripFilterRoutes);

// ---- master data & core modules ----
app.use("/api", driverRoutes);
app.use("/api", vehicleRoutes);
app.use("/api", warehouseRoutes);
app.use("/api", orderRoutes);
app.use("/api", assignmentRoutes);
app.use("/api", tripRoutes);
app.use("/api", gpsRoutes);
app.use("/api", routeRoutes);

// ======================================================
// HEALTH CHECK (OPTIONAL BUT RECOMMENDED)
// ======================================================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// ======================================================
// START SERVER
// ======================================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
