// backend/index.js
// FULL backend (updated) — adds activity logging compatible with Prisma schema where ActivityLog.userId is optional

const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, roleMiddleware } = require("./middleware/auth");
require("dotenv").config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.set("trust proxy", true); // respect X-Forwarded-For etc
app.use(cors());
app.use(express.json());
app.use(cookieParser());

/* ======================================================
   MQTT CLIENT (IoT → DB)
====================================================== */
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);

mqttClient.on("connect", () => {
  console.log("✅ Connected to MQTT Broker");
  try {
    const topics = (process.env.MQTT_TOPICS || "").split(",").map(t => t.trim()).filter(Boolean);
    if (topics.length) {
      mqttClient.subscribe(topics, (err) => {
        if (err) console.error("MQTT Subscribe error:", err);
      });
    } else {
      console.warn("⚠️ MQTT_TOPICS empty — no topic subscribed");
    }
  } catch (e) {
    console.error("Error subscribing to MQTT topics:", e);
  }
});

mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("📡 MQTT Update:", topic, data);

    if (topic === "vehicle/position") {
      const vehicleId = Number(data.vehicleId);
      if (!vehicleId || Number.isNaN(vehicleId)) {
        console.warn("MQTT payload missing/invalid vehicleId:", data);
        return;
      }

      await prisma.position.create({
        data: {
          vehicleId,
          latitude: Number(data.lat),
          longitude: Number(data.lng),
          speed: data.speed != null ? Number(data.speed) : null,
        },
      });

      const existing = await prisma.status.findFirst({ where: { vehicleId } });
      if (existing) {
        await prisma.status.update({
          where: { id: existing.id },
          data: {
            isOnline: true,
            battery: data.battery != null ? Number(data.battery) : existing.battery,
            timestamp: new Date(),
          },
        });
      } else {
        await prisma.status.create({
          data: {
            vehicleId,
            isOnline: true,
            battery: data.battery != null ? Number(data.battery) : null,
          },
        });
      }
    }
  } catch (err) {
    console.error("Error handling MQTT message:", err);
  }
});

/* ======================================================
   HELPER: write activity log
   userId is optional (nullable) to match updated Prisma schema
   safe wrapper so logging failure won't break endpoints
====================================================== */
async function writeActivityLog({
  userId,
  action,
  entity = null,
  entityId = null,
  description = "",
  req = null,
  metadata = null,
}) {
  try {
    // ================================
    // 🔌 Toggle Activity Logs (ON/OFF)
    // ================================
    if (process.env.ACTIVITY_LOGS_ENABLED === "false") {
      return; // langsung keluar: logging dimatikan
    }

    // normalize userId: only accept string values, otherwise set null
    const uid =
      typeof userId === "string" && userId.trim() !== ""
        ? userId
        : null;

    await prisma.activityLog.create({
      data: {
        userId: uid,
        action,
        entity,
        entityId: entityId != null ? String(entityId) : null,
        description,
        ipAddress: req?.ip || null,
        userAgent: req?.headers?.["user-agent"] || null,
        metadata: metadata || {},
      },
    });
  } catch (err) {
    console.error("Failed to write activity log:", err.message || err);
  }
}


/* ======================================================
   ASSIGNMENT APIs
====================================================== */
app.get("/api/assignment/users", authMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" }
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "USER",
      description: "Viewed assignment users list",
      req,
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   AUTHENTICATION APIs
====================================================== */
app.post("/api/auth/register", authMiddleware, roleMiddleware(["ADMIN", "SUPERADMIN"]), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: role || "VIEWER" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "CREATE",
      entity: "USER",
      entityId: user.id,
      description: `Created new user: ${user.email}`,
      req,
    });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Optionally log failed login WITHOUT userId (userId nullable)
      await writeActivityLog({
        userId: null,
        action: "LOGIN_FAILED",
        entity: "USER",
        description: `Login failed for email: ${email}`,
        req,
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await writeActivityLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        entity: "USER",
        entityId: user.id,
        description: `Login failed (wrong password) for user ${user.email}`,
        req,
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // update last login fields
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: req.ip }
    });

    // write login activity (with ip + userAgent)
    await writeActivityLog({
      userId: user.id,
      action: "LOGIN",
      entity: "USER",
      entityId: user.id,
      description: `User logged in`,
      req,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGOUT
app.post("/api/auth/logout", authMiddleware, async (req, res) => {
  try {
    await writeActivityLog({
      userId: req.user?.id,
      action: "LOGOUT",
      entity: "USER",
      entityId: req.user?.id,
      description: "User logged out",
      req,
    });

    // If you have sessions or refresh tokens, revoke here.

    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PROFILE
app.get("/api/auth/profile", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true, createdAt: true, profileImage: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "USER",
      entityId: req.user?.id,
      description: "Viewed own profile",
      req,
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL USERS (ADMIN)
app.get("/api/auth/users", authMiddleware, roleMiddleware(["ADMIN", "SUPERADMIN"]), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true, lastLoginIp: true, createdAt: true, profileImage: true },
      orderBy: { createdAt: "desc" },
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "USER",
      description: "Viewed users list",
      req,
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE USER (ADMIN)
app.put("/api/auth/users/:id", authMiddleware, roleMiddleware(["ADMIN", "SUPERADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, email } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { ...(name && { name }), ...(role && { role }), ...(email && { email }) },
      select: { id: true, email: true, name: true, role: true, updatedAt: true },
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "UPDATE",
      entity: "USER",
      entityId: id,
      description: `Updated user: ${user.email}`,
      req,
      metadata: { changes: req.body },
    });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE USER (ADMIN)
app.delete("/api/auth/users/:id", authMiddleware, roleMiddleware(["ADMIN", "SUPERADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.delete({ where: { id } });

    await writeActivityLog({
      userId: req.user?.id,
      action: "DELETE",
      entity: "USER",
      entityId: id,
      description: `Deleted user: ${user.email}`,
      req,
    });

    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHANGE PASSWORD
app.post("/api/auth/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current and new password required" });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) return res.status(401).json({ error: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashedPassword } });

    await writeActivityLog({
      userId: req.user?.id,
      action: "UPDATE",
      entity: "USER",
      entityId: req.user?.id,
      description: "Changed password",
      req,
    });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   ACTIVITY LOG APIs
====================================================== */
app.get("/api/activity", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, action, entity, startDate, endDate, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN") where.userId = req.user.id;
    else if (userId) where.userId = userId;

    if (action) where.action = action;
    if (entity) where.entity = entity;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
        { userAgent: { contains: search, mode: "insensitive" } },
      ];
    }

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Log that user viewed activity list (nullable userId handled)
    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "ACTIVITY_LOG",
      description: "Viewed activity logs",
      req,
    });

    res.json({
      activities,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activity detail
app.get("/api/activity/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    const log = await prisma.activityLog.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } }
    });

    if (!log) return res.status(404).json({ error: "Activity log not found" });

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "ACTIVITY_LOG",
      entityId: id,
      description: `Viewed activity log ${id}`,
      req,
    });

    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   VEHICLE APIs (Protected)
====================================================== */
app.get("/api/vehicles", authMiddleware, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { positions: { orderBy: { timestamp: "desc" }, take: 1 } }
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "VEHICLE",
      description: "Viewed vehicle list",
      req,
    });

    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/vehicles/latest", authMiddleware, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { positions: { orderBy: { timestamp: "desc" }, take: 1 } }
    });

    const flat = vehicles.map((v) => ({
      id: v.id,
      name: v.name,
      driver: v.driver,
      route: v.route,
      latitude: v.positions[0]?.latitude || null,
      longitude: v.positions[0]?.longitude || null,
      speed: v.positions[0]?.speed || 0,
      timestamp: v.positions[0]?.timestamp || null,
    }));

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "VEHICLE",
      description: "Viewed vehicles latest snapshot",
      req,
    });

    res.json(flat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/vehicles", authMiddleware, roleMiddleware(["USER", "ADMIN", "SUPERADMIN"]), async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });

    await writeActivityLog({
      userId: req.user?.id,
      action: "CREATE",
      entity: "VEHICLE",
      entityId: vehicle.id.toString(),
      description: `Created vehicle: ${vehicle.name}`,
      req,
    });

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/vehicle-position", authMiddleware, async (req, res) => {
  try {
    const { vehicleId, latitude, longitude, speed } = req.body;
    const pos = await prisma.position.create({
      data: { vehicleId: Number(vehicleId), latitude, longitude, speed }
    });

    // by default we do not log every position create to avoid noise
    res.json({ success: true, data: pos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/vehicles/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { positions: true }
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "VEHICLE",
      entityId: id,
      description: `Viewed vehicle detail: ${id}`,
      req,
    });

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/vehicle-position/history/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const range = req.query.range || "7d";
    let days = 7;
    if (range === "30d") days = 30;
    if (range === "1d") days = 1;

    const data = await prisma.position.findMany({
      where: { vehicleId: id, timestamp: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } },
      orderBy: { timestamp: "asc" },
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "POSITION",
      entityId: id,
      description: `Viewed position history for vehicle ${id}`,
      req,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   DRIVER & ROUTE APIs (Protected)
====================================================== */
app.get("/api/drivers", authMiddleware, async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany();

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "DRIVER",
      description: "Viewed drivers list",
      req,
    });

    res.json(drivers.map((d) => d.name));
  } catch (err) {
    console.error("Drivers fetch error:", err);
    res.status(200).json([]);
  }
});

app.post("/api/drivers", authMiddleware, roleMiddleware(["USER", "ADMIN", "SUPERADMIN"]), async (req, res) => {
  try {
    const { name } = req.body;
    const driver = await prisma.driver.create({ data: { name } });

    await writeActivityLog({
      userId: req.user?.id,
      action: "CREATE",
      entity: "DRIVER",
      entityId: driver.id,
      description: `Created driver: ${name}`,
      req,
    });

    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/routes", authMiddleware, async (req, res) => {
  try {
    const routes = await prisma.route.findMany();

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "ROUTE",
      description: "Viewed routes list",
      req,
    });

    res.json(routes.map((r) => r.name));
  } catch (err) {
    console.error("Routes fetch error:", err);
    res.status(200).json([]);
  }
});

app.post("/api/routes", authMiddleware, roleMiddleware(["USER", "ADMIN", "SUPERADMIN"]), async (req, res) => {
  try {
    const { name } = req.body;
    const route = await prisma.route.create({ data: { name } });

    await writeActivityLog({
      userId: req.user?.id,
      action: "CREATE",
      entity: "ROUTE",
      entityId: route.id,
      description: `Created route: ${name}`,
      req,
    });

    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   OSRM ROUTE API (Protected)
====================================================== */
app.get("/api/route", authMiddleware, async (req, res) => {
  try {
    const { origin, destination } = req.query;
    if (!origin || !destination) return res.status(400).json({ error: "origin & destination required" });

    const [lat1, lng1] = origin.split(",");
    const [lat2, lng2] = destination.split(",");

    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const response = await axios.get(url);

    if (!response.data.routes || response.data.routes.length === 0) return res.status(404).json({ error: "No route found" });

    const coordinates = response.data.routes[0].geometry.coordinates;
    const coords = coordinates.map(([lng, lat]) => ({ lat, lng }));

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "OSRM_ROUTE",
      description: `Requested route from ${origin} to ${destination}`,
      req,
    });

    res.json({ coords });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   VEHICLE STATS API (Protected)
====================================================== */
app.get("/api/stats", authMiddleware, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ include: { positions: { orderBy: { timestamp: "desc" }, take: 1 } } });
    const latest = vehicles.map((v) => ({ speed: v.positions[0]?.speed || 0 }));

    const idle = latest.filter((v) => v.speed === 0).length;
    const onTrip = latest.filter((v) => v.speed > 0).length;
    const avgSpeed = latest.length > 0 ? (latest.reduce((acc, v) => acc + v.speed, 0) / latest.length).toFixed(1) : 0;

    const stats = { idle, onTrip, completed: 0, avgTripDuration: "-", avgSpeed: Number(avgSpeed), onTime: 0, delay: 0, early: 0 };

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "STATS",
      description: "Viewed vehicle stats",
      req,
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   START SERVER
====================================================== */
app.listen(PORT, () => {
  console.log(`🚀 Backend running → http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔐 JWT Secret configured: ${!!process.env.JWT_SECRET}`);
});
