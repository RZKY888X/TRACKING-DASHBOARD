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
    res.json(await prisma.warehouse.findMany({ orderBy: { city: "asc" } }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST city
app.post("/api/routes", async (req, res) => {
  try {
    const { city } = req.body;
    if (!city) return res.status(400).json({ error: "City required" });

    res.json(await prisma.warehouse.create({ data: { city } }));
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

// GET trips dengan filter yang lengkap - REVISI
app.get("/api/trips/filter", authMiddleware, async (req, res) => {
  try {
    const {
      dateType,
      dateValue,
      driverName,
      originName,
      destinationName
    } = req.query;

    console.log("📊 Filter params:", { dateType, dateValue, driverName, originName, destinationName });

    // Build filter object
    const where = {};

    // Filter by dateType
    if (dateType) {
      const now = new Date();
      
      switch (dateType) {
        case "current":
          // Current: ambil semua data tanpa filter tanggal
          // Tidak ada filter tanggal untuk current
          break;
          
        case "daily":
          if (dateValue) {
            const dailyDate = new Date(dateValue);
            const startDate = new Date(dailyDate.setHours(0, 0, 0, 0));
            const endDate = new Date(dailyDate.setHours(23, 59, 59, 999));
            where.startTime = {
              gte: startDate,
              lte: endDate
            };
          }
          break;
          
        case "weekly":
          if (dateValue && dateValue.includes('Week')) {
            const [yearMonth, weekStr] = dateValue.split(' Week ');
            const [year, month] = yearMonth.split('-').map(Number);
            const week = parseInt(weekStr);
            
            const weekStart = (week - 1) * 7 + 1;
            const weekEnd = week * 7;
            
            const startDate = new Date(year, month - 1, weekStart, 0, 0, 0, 0);
            const endDate = new Date(year, month - 1, weekEnd, 23, 59, 59, 999);
            
            where.startTime = {
              gte: startDate,
              lte: endDate
            };
          }
          break;
          
        case "monthly":
          if (dateValue) {
            const [year, month] = dateValue.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            
            where.startTime = {
              gte: startDate,
              lte: endDate
            };
          }
          break;
      }
    }

    // Filter by driver name
    if (driverName && driverName !== "Select Driver" && driverName !== "No drivers available") {
      const cleanDriverName = driverName.split('(')[0].trim();
      where.driver = {
        name: {
          contains: cleanDriverName,
          mode: "insensitive"
        }
      };
    }

    // Filter by origin
    if (originName && originName !== "Select Origin" && originName !== "No origins available") {
      const cleanOriginName = originName.split('(')[0].trim();
      where.origin = {
        name: {
          contains: cleanOriginName,
          mode: "insensitive"
        }
      };
    }

    // Filter by destination
    if (destinationName && destinationName !== "Select Departure" && destinationName !== "No departures available") {
      const cleanDestName = destinationName.split('(')[0].trim();
      where.destination = {
        name: {
          contains: cleanDestName,
          mode: "insensitive"
        }
      };
    }

    console.log("📋 Where clause:", JSON.stringify(where, null, 2));

    // Get trips with includes
    const trips = await prisma.trip.findMany({
      where,
      include: {
        driver: true,
        vehicle: {
          include: {
            positions: {
              orderBy: { timestamp: "desc" },
              take: 1
            }
          }
        },
        origin: true,
        destination: true
      },
      orderBy: { startTime: "desc" }
    });

    console.log(`✅ Found ${trips.length} trips`);

    res.json({
      success: true,
      trips: trips.map(trip => ({
        id: trip.id,
        driverId: trip.driverId,
        vehicleId: trip.vehicleId,
        originId: trip.originId,
        destinationId: trip.destinationId,
        status: trip.status,
        startTime: trip.startTime,
        endTime: trip.endTime,
        avgSpeed: trip.avgSpeed,
        driver: trip.driver,
        vehicle: {
          id: trip.vehicle.id,
          plate: trip.vehicle.plate,
          type: trip.vehicle.type,
          positions: trip.vehicle.positions || []
        },
        origin: trip.origin,
        destination: trip.destination
      })),
      count: trips.length
    });

  } catch (err) {
    console.error("❌ Error filtering trips:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      trips: [],
      count: 0
    });
  }
});

// GET filter options berdasarkan tanggal - REVISI
app.get("/api/filter/options", authMiddleware, async (req, res) => {
  try {
    const { dateType, dateValue } = req.query;

    console.log("🔍 Fetching filter options for:", { dateType, dateValue });

    let where = {};

    // Hanya filter tanggal jika bukan "current" dan ada dateValue
    if (dateType && dateType !== "current" && dateValue) {
      let startDate, endDate;

      switch (dateType) {
        case "daily":
          const dailyDate = new Date(dateValue);
          startDate = new Date(dailyDate.setHours(0, 0, 0, 0));
          endDate = new Date(dailyDate.setHours(23, 59, 59, 999));
          where.startTime = {
            gte: startDate,
            lte: endDate
          };
          break;

        case "weekly":
          if (dateValue.includes('Week')) {
            const [yearMonth, weekStr] = dateValue.split(' Week ');
            const [year, month] = yearMonth.split('-').map(Number);
            const week = parseInt(weekStr);
            
            const weekStart = (week - 1) * 7 + 1;
            const weekEnd = week * 7;
            
            startDate = new Date(year, month - 1, weekStart, 0, 0, 0, 0);
            endDate = new Date(year, month - 1, weekEnd, 23, 59, 59, 999);
            
            where.startTime = {
              gte: startDate,
              lte: endDate
            };
          }
          break;

        case "monthly":
          const [year, month] = dateValue.split('-').map(Number);
          startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
          endDate = new Date(year, month, 0, 23, 59, 59, 999);
          
          where.startTime = {
            gte: startDate,
            lte: endDate
          };
          break;
      }
    }

    console.log("📅 Date filter for options:", JSON.stringify(where, null, 2));

    // Get trips with includes
    const trips = await prisma.trip.findMany({
      where,
      include: {
        driver: true,
        origin: true,
        destination: true
      },
      distinct: ['driverId', 'originId', 'destinationId']
    });

    console.log(`📊 Found ${trips.length} trips for options`);

    // Extract unique values
    const driversMap = new Map();
    const originsMap = new Map();
    const destinationsMap = new Map();

    trips.forEach(trip => {
      if (trip.driver) {
        driversMap.set(trip.driver.id, trip.driver);
      }
      if (trip.origin) {
        originsMap.set(trip.origin.id, trip.origin);
      }
      if (trip.destination) {
        destinationsMap.set(trip.destination.id, trip.destination);
      }
    });

    const drivers = Array.from(driversMap.values());
    const origins = Array.from(originsMap.values());
    const destinations = Array.from(destinationsMap.values());

    console.log(`👤 Drivers: ${drivers.length}, 📍 Origins: ${origins.length}, 🎯 Destinations: ${destinations.length}`);

    // Jika tidak ada trip, kembalikan array kosong
    res.json({
      success: true,
      drivers: drivers.map(d => ({
        id: d.id,
        name: d.name,
        email: d.email || null
      })),
      origins: origins.map(o => ({
        id: o.id,
        name: o.name,
        city: o.city
      })),
      destinations: destinations.map(d => ({
        id: d.id,
        name: d.name,
        city: d.city
      }))
    });

  } catch (err) {
    console.error("❌ Error getting filter options:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      drivers: [],
      origins: [],
      destinations: []
    });
  }
});

// GET dashboard stats dengan filter - REVISI
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const { dateType, dateValue, driver, route, departureRoute } = req.query;
    
    console.log("📈 Stats filter:", { dateType, dateValue, driver, route, departureRoute });

    // Build filter for trips
    const where = {};
    
    // Filter by date
    if (dateType && dateType !== "current" && dateValue) {
      let startDate, endDate;

      switch (dateType) {
        case "daily":
          const dailyDate = new Date(dateValue);
          startDate = new Date(dailyDate.setHours(0, 0, 0, 0));
          endDate = new Date(dailyDate.setHours(23, 59, 59, 999));
          where.startTime = {
            gte: startDate,
            lte: endDate
          };
          break;

        case "weekly":
          if (dateValue.includes('Week')) {
            const [yearMonth, weekStr] = dateValue.split(' Week ');
            const [year, month] = yearMonth.split('-').map(Number);
            const week = parseInt(weekStr);
            
            const weekStart = (week - 1) * 7 + 1;
            const weekEnd = week * 7;
            
            startDate = new Date(year, month - 1, weekStart, 0, 0, 0, 0);
            endDate = new Date(year, month - 1, weekEnd, 23, 59, 59, 999);
            
            where.startTime = {
              gte: startDate,
              lte: endDate
            };
          }
          break;

        case "monthly":
          const [year, month] = dateValue.split('-').map(Number);
          startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
          endDate = new Date(year, month, 0, 23, 59, 59, 999);
          
          where.startTime = {
            gte: startDate,
            lte: endDate
          };
          break;
      }
    }
    
    // Filter by driver
    if (driver && driver !== "Select Driver" && driver !== "No drivers available") {
      const cleanDriver = driver.split('(')[0].trim();
      where.driver = {
        name: {
          contains: cleanDriver,
          mode: "insensitive"
        }
      };
    }
    
    // Filter by route (origin)
    if (route && route !== "Select Origin" && route !== "No origins available") {
      const cleanRoute = route.split('(')[0].trim();
      where.origin = {
        name: {
          contains: cleanRoute,
          mode: "insensitive"
        }
      };
    }
    
    // Filter by departure (destination)
    if (departureRoute && departureRoute !== "Select Departure" && departureRoute !== "No departures available") {
      const cleanDeparture = departureRoute.split('(')[0].trim();
      where.destination = {
        name: {
          contains: cleanDeparture,
          mode: "insensitive"
        }
      };
    }

    // Get trips with filter
    const trips = await prisma.trip.findMany({
      where,
      include: {
        driver: true,
        vehicle: {
          include: {
            positions: {
              orderBy: { timestamp: "desc" },
              take: 1
            }
          }
        },
        origin: true,
        destination: true
      }
    });

    // Calculate stats
    let idle = 0;
    let onTrip = 0;
    let completed = 0;
    let onTime = 0;
    let delay = 0;
    let early = 0;
    
    const durations = [];
    const speeds = [];
    const driverSet = new Set();
    const vehicleSet = new Set();
    const routeSet = new Set();

    trips.forEach(trip => {
      // Count by status
      if (trip.status === "ON_TRIP") {
        onTrip++;
      } else if (trip.status === "COMPLETED") {
        completed++;
        
        // Check if on time (dummy logic)
        if (trip.endTime) {
          const endTime = new Date(trip.endTime);
          const scheduledTime = new Date(trip.startTime);
          scheduledTime.setHours(scheduledTime.getHours() + 2); // Assume 2 hours scheduled
          
          if (endTime <= scheduledTime) {
            onTime++;
          } else {
            delay++;
          }
        }
      } else {
        idle++;
      }
      
      // Calculate duration for completed trips
      if (trip.status === "COMPLETED" && trip.startTime && trip.endTime) {
        const start = new Date(trip.startTime);
        const end = new Date(trip.endTime);
        const duration = (end - start) / (1000 * 60); // in minutes
        durations.push(duration);
      }
      
      // Get speed from latest position
      if (trip.vehicle?.positions?.[0]?.speed) {
        speeds.push(trip.vehicle.positions[0].speed);
      } else if (trip.avgSpeed) {
        speeds.push(trip.avgSpeed);
      }
      
      // Collect unique counts
      if (trip.driver) driverSet.add(trip.driver.id);
      if (trip.vehicle) vehicleSet.add(trip.vehicle.id);
      if (trip.origin && trip.destination) {
        routeSet.add(`${trip.origin.id}-${trip.destination.id}`);
      }
    });

    // Calculate averages
    const avgTripDuration = durations.length > 0 
      ? Math.round(durations.reduce((a, b) => a + b) / durations.length)
      : 0;
      
    const avgSpeed = speeds.length > 0
      ? Math.round(speeds.reduce((a, b) => a + b) / speeds.length)
      : 0;

    // Early arrivals (dummy calculation)
    early = Math.floor(completed * 0.3);

    res.json({
      success: true,
      stats: {
        idle,
        onTrip,
        completed,
        onTime,
        delay,
        early,
        avgTripDuration: avgTripDuration > 0 ? `${avgTripDuration} min` : "-",
        avgSpeed,
        totalDrivers: driverSet.size,
        totalVehicles: vehicleSet.size,
        totalRoutes: routeSet.size
      }
    });

  } catch (err) {
    console.error("❌ Error fetching stats:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      stats: {
        idle: 0,
        onTrip: 0,
        completed: 0,
        onTime: 0,
        delay: 0,
        early: 0,
        avgTripDuration: "-",
        avgSpeed: 0,
        totalDrivers: 0,
        totalVehicles: 0,
        totalRoutes: 0
      }
    });
  }
});

/* ======================================================
   START SERVER
====================================================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});