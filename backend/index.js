// backend/index.js
// FULL backend (updated) — activity logging compatible with Prisma schema where ActivityLog.userId is optional

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
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

/* ======================================================
   MQTT CLIENT (IoT → DB)
====================================================== */
if (process.env.MQTT_BROKER_URL) {
  const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);

  mqttClient.on("connect", () => {
    console.log("✅ Connected to MQTT Broker");
    try {
      const topics = (process.env.MQTT_TOPICS || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
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
} else {
  console.warn("MQTT_BROKER_URL not configured — MQTT client disabled.");
}

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
    if (process.env.ACTIVITY_LOGS_ENABLED === "false") return;

    const uid = typeof userId === "string" && userId.trim() !== "" ? userId : null;

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
    console.error("Failed to write activity log:", err?.message || err);
  }
}

/* ======================================================
   AUTHENTICATION APIs
====================================================== */
app.post("/api/auth/register", authMiddleware, roleMiddleware(["ADMIN", "SUPERADMIN"]), async (req, res) => {
  try {
    const { email, password, name, role, jobRole } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: role || "VIEWER", jobRole },
      select: { id: true, email: true, name: true, role: true, jobRole: true, createdAt: true },
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

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: req.ip },
    });

    await writeActivityLog({
      userId: user.id,
      action: "LOGIN",
      entity: "USER",
      entityId: user.id,
      description: `User logged in`,
      req,
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

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
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true, createdAt: true, profileImage: true, jobRole: true },
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
      select: { id: true, email: true, name: true, role: true, jobRole: true, lastLoginAt: true, lastLoginIp: true, createdAt: true, profileImage: true },
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
    const { name, role, email, jobRole } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { ...(name && { name }), ...(role && { role }), ...(email && { email }), ...(jobRole !== undefined && { jobRole }) },
      select: { id: true, email: true, name: true, role: true, jobRole: true, updatedAt: true },
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
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
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


// GET drivers
app.get("/api/drivers", async (req, res) => {
  try {
    res.json(await prisma.driver.findMany({ orderBy: { name: "asc" } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST driver
app.post("/api/drivers", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Driver name required" });

    res.json(await prisma.driver.create({ data: { name } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET vehicles
app.get("/api/vehicles", async (req, res) => {
  try {
    res.json(await prisma.vehicle.findMany({ orderBy: { plate: "asc" } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST vehicle
app.post("/api/vehicles", async (req, res) => {
  try {
    const { plate, type } = req.body;
    if (!plate) return res.status(400).json({ error: "Plate required" });

    res.json(await prisma.vehicle.create({ data: { plate, type } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET cities
app.get("/api/routes", async (req, res) => {
  try {
    res.json(await prisma.route.findMany({ orderBy: { city: "asc" } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST city
app.post("/api/routes", async (req, res) => {
  try {
    const { city } = req.body;
    if (!city) return res.status(400).json({ error: "City required" });

    res.json(await prisma.route.create({ data: { city } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET warehouses
app.get("/api/warehouses", async (req, res) => {
  try {
    res.json(await prisma.warehouse.findMany({
      orderBy: { name: "asc" }
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST warehouse
app.post("/api/warehouses", async (req, res) => {
  try {
    const { name, city, latitude, longitude } = req.body;

    if (!name || !city || !latitude || !longitude)
      return res.status(400).json({ error: "Incomplete warehouse data" });

    const warehouse = await prisma.warehouse.create({
      data: { name, city, latitude, longitude }
    });

    res.json(warehouse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/trips/start
app.post("/api/trips/start", async (req, res) => {
  try {
    const { driverId, vehicleId, originId } = req.body;

    // Cek trip aktif driver
    const active = await prisma.trip.findFirst({
      where: { driverId, status: "ON_TRIP" }
    });
    if (active)
      return res.status(400).json({ error: "Trip still active" });

    // Create trip baru
    const trip = await prisma.trip.create({
      data: {
        driverId,
        vehicleId,
        originId,
        status: "ON_TRIP"
      }
    });

    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/trips/end", async (req, res) => {
  try {
    const { tripId, destinationId, avgSpeed } = req.body;

    res.json(await prisma.trip.update({
      where: { id: tripId },
      data: {
        destinationId,
        status: "COMPLETED",
        endTime: new Date(),
        avgSpeed
      }
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/gps/push", async (req, res) => {
  try {
    const { tripId, vehicleId, latitude, longitude, speed } = req.body;

    res.json(await prisma.position.create({
      data: { tripId, vehicleId, latitude, longitude, speed }
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/dashboard/map", async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        positions: { take: 1, orderBy: { timestamp: "desc" } },
        statuses: { take: 1, orderBy: { timestamp: "desc" } },
        trips: {
          where: { status: "ON_TRIP" },
          include: {
            origin: true,
            destination: true,
            driver: true,
            user: true
          }
        }
      }
    });

    const warehouses = await prisma.warehouse.findMany();

    res.json({ vehicles, warehouses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ======================================================
   START SERVER
====================================================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});