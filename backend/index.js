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

function parseNameAndCity(str) {
  if (!str) return { name: null, city: null };
  const match = str.match(/(.*)\s*\((.*)\)/);
  if (match) {
    return { 
      name: match[1].trim(), 
      city: match[2].trim() 
    };
  } else {
    return { 
      name: str.trim(), 
      city: null 
    };
  }
}

// Di dalam index.js, ganti fungsi buildDateFilter dan tambahkan endpoint yang lebih spesifik

function buildDateFilter(dateType, dateValue) {
  if (!dateType || !dateValue) return {};
  
  const now = new Date();
  let startDate, endDate;

  switch (dateType) {
    case "current":
      return {};

    case "daily":
      const dailyDate = new Date(dateValue);
      startDate = new Date(dailyDate.setHours(0, 0, 0, 0));
      endDate = new Date(dailyDate.setHours(23, 59, 59, 999));
      return {
        startTime: {
          gte: startDate,
          lte: endDate
        }
      };

    case "weekly":
      if (dateValue.includes('Week')) {
        const [yearMonth, weekStr] = dateValue.split(' Week ');
        const [year, month] = yearMonth.split('-').map(Number);
        const week = parseInt(weekStr);
        
        const weekStart = (week - 1) * 7 + 1;
        const weekEnd = week * 7;
        
        startDate = new Date(year, month - 1, weekStart, 0, 0, 0, 0);
        endDate = new Date(year, month - 1, weekEnd, 23, 59, 59, 999);
        
        return {
          startTime: {
            gte: startDate,
            lte: endDate
          }
        };
      }
      return {};

    case "monthly":
      const [year, month] = dateValue.split('-').map(Number);
      startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      return {
        startTime: {
          gte: startDate,
          lte: endDate
        }
      };

    default:
      return {};
  }
}


// GET filter options cascade - VERSI TERBAIK
app.get("/api/filter/cascade-options", authMiddleware, async (req, res) => {
  try {
    const { dateType, dateValue, driverName, originName } = req.query;
    
    console.log("🔍 Cascade filter options:", { dateType, dateValue, driverName, originName });

    // Build base filter
    const dateFilter = buildDateFilter(dateType, dateValue);
    const baseWhere = dateFilter;

    // Step 1: Get ALL drivers (for current view) atau berdasarkan date filter
    let driverWhere = {};
    if (dateType === "current") {
      // Untuk current, ambil semua driver yang pernah ada trip
      const allDrivers = await prisma.driver.findMany({
        select: { id: true, name: true }
      });
      var drivers = allDrivers;
    } else {
      // Untuk date filter, ambil driver yang punya trip di tanggal tersebut
      const driverTrips = await prisma.trip.findMany({
        where: baseWhere,
        select: {
          driver: {
            select: {
              id: true,
              name: true
            }
          }
        },
        distinct: ['driverId']
      });
      var drivers = driverTrips.map(t => t.driver).filter(Boolean);
    }

    // Step 2: Get origins untuk driver yang dipilih atau semua origins
    let origins = [];
    if (drivers.length > 0) {
      let originWhere = dateType === "current" ? {} : { ...baseWhere };
      
      // Filter by driver jika selected
      if (driverName && driverName !== "Select Driver" && driverName !== "No drivers available") {
        const cleanDriverName = driverName.split('(')[0].trim();
        const driver = drivers.find(d => d.name === cleanDriverName);
        if (driver) {
          originWhere.driverId = driver.id;
        }
      }

      const originTrips = await prisma.trip.findMany({
        where: originWhere,
        select: {
          origin: {
            select: {
              id: true,
              name: true,
              city: true
            }
          }
        },
        distinct: ['originId']
      });

      origins = originTrips.map(t => t.origin).filter(Boolean);
    }

    // Step 3: Get destinations untuk driver DAN origin yang dipilih
    let destinations = [];
    if (origins.length > 0) {
      let destWhere = dateType === "current" ? {} : { ...baseWhere };
      
      // Filter by driver jika selected
      if (driverName && driverName !== "Select Driver" && driverName !== "No drivers available") {
        const cleanDriverName = driverName.split('(')[0].trim();
        const driver = drivers.find(d => d.name === cleanDriverName);
        if (driver) {
          destWhere.driverId = driver.id;
        }
      }
      
      // Filter by origin jika selected
      if (originName && originName !== "Select Origin" && originName !== "No origins available") {
        const cleanOriginName = originName.split('(')[0].trim();
        const origin = origins.find(o => 
          o.name === cleanOriginName || 
          `${o.name} (${o.city})` === originName
        );
        if (origin) {
          destWhere.originId = origin.id;
        }
      }

      // Hanya ambil trips yang punya destination
      destWhere.destinationId = { not: null };

      const destTrips = await prisma.trip.findMany({
        where: destWhere,
        select: {
          destination: {
            select: {
              id: true,
              name: true,
              city: true
            }
          }
        },
        distinct: ['destinationId']
      });

      destinations = destTrips.map(t => t.destination).filter(Boolean);
    }

    console.log(`📊 Cascade results: ${drivers.length} drivers, ${origins.length} origins, ${destinations.length} destinations`);

    res.json({
      success: true,
      drivers: drivers.map(d => ({
        id: d.id,
        name: d.name
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
    console.error("❌ Error in cascade options:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      drivers: [],
      origins: [],
      destinations: []
    });
  }
});

// GET trips filter dengan speed yang benar - VERSI TERBAIK
app.get("/api/trips/filter", authMiddleware, async (req, res) => {
  try {
    const {
      dateType,
      dateValue,
      driverName,
      originName,
      destinationName
    } = req.query;

    console.log("📊 Filter trips params:", { dateType, dateValue, driverName, originName, destinationName });

    // Build filter
    const dateFilter = buildDateFilter(dateType, dateValue);
    const where = { ...dateFilter };

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

    console.log("📋 Trip filter where:", JSON.stringify(where, null, 2));

    // Get trips dengan include yang benar
    const trips = await prisma.trip.findMany({
      where,
      include: {
        driver: true,
        vehicle: true,
        origin: true,
        destination: true,
        positions: {
          orderBy: { timestamp: "desc" },
          take: 1
        }
      },
      orderBy: [
        { status: "desc" }, // ON_TRIP first
        { startTime: "desc" }
      ]
    });

    console.log(`✅ Found ${trips.length} trips`);

    // Transform data dengan speed yang benar
    const transformedTrips = trips.map(trip => {
      const latestPosition = trip.positions?.[0];
      
      // Prioritaskan avgSpeed dari database, lalu dari latest position
      let speed = 0;
      if (trip.avgSpeed !== null && trip.avgSpeed !== undefined) {
        speed = trip.avgSpeed;
      } else if (latestPosition?.speed) {
        speed = latestPosition.speed;
      }

      return {
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
        vehicle: trip.vehicle,
        origin: trip.origin,
        destination: trip.destination,
        positions: trip.positions,
        latestPosition: latestPosition,
        displaySpeed: speed
      };
    });

    res.json({
      success: true,
      trips: transformedTrips,
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

// GET dashboard stats dengan filter yang benar - VERSION 2
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const { dateType, dateValue, driver, route, departureRoute } = req.query;
    
    console.log("📈 Stats filter:", { dateType, dateValue, driver, route, departureRoute });

    // Build filter menggunakan fungsi buildDateFilter yang sudah ada
    const dateFilter = buildDateFilter(dateType, dateValue);
    const where = { ...dateFilter };

    // Helper function untuk parse nama (Name (City))
    const parseNameFromDisplay = (displayName) => {
      if (!displayName) return null;
      // Format: "Name (City)" atau hanya "Name"
      const match = displayName.match(/(.*?)(?:\s*\((.*)\))?$/);
      return match ? match[1].trim() : displayName;
    };

    // Filter by driver
    if (driver && driver !== "Select Driver" && driver !== "No drivers available") {
      const cleanDriver = parseNameFromDisplay(driver);
      where.driver = {
        name: {
          contains: cleanDriver,
          mode: "insensitive"
        }
      };
    }
    
    // Filter by route (origin)
    if (route && route !== "Select Origin" && route !== "No origins available") {
      const cleanRoute = parseNameFromDisplay(route);
      where.origin = {
        name: {
          contains: cleanRoute,
          mode: "insensitive"
        }
      };
    }
    
    // Filter by departure (destination)
    if (departureRoute && departureRoute !== "Select Departure" && departureRoute !== "No departures available") {
      const cleanDeparture = parseNameFromDisplay(departureRoute);
      where.destination = {
        name: {
          contains: cleanDeparture,
          mode: "insensitive"
        }
      };
    }

    console.log("📋 Stats where clause:", JSON.stringify(where, null, 2));

    // 1. GET BASELINE DATA GLOBAL (semua trip COMPLETED tanpa filter)
    const baselineTrips = await prisma.trip.findMany({
      where: {
        status: "COMPLETED",
        endTime: { not: null }
      },
      select: {
        startTime: true,
        endTime: true,
        originId: true,
        destinationId: true
      }
    });

    // Hitung baseline global
    let baselineTotalDuration = 0;
    let baselineCount = 0;
    const routeBaselines = new Map(); // key: "originId-destinationId"

    baselineTrips.forEach(trip => {
      if (trip.startTime && trip.endTime) {
        const start = new Date(trip.startTime);
        const end = new Date(trip.endTime);
        const duration = (end - start) / (1000 * 60);
        
        baselineTotalDuration += duration;
        baselineCount++;
        
        // Simpan per rute
        if (trip.originId && trip.destinationId) {
          const routeKey = `${trip.originId}-${trip.destinationId}`;
          if (!routeBaselines.has(routeKey)) {
            routeBaselines.set(routeKey, []);
          }
          routeBaselines.get(routeKey).push(duration);
        }
      }
    });

    // Hitung baseline rata-rata (global dan per rute)
    const globalBaselineDuration = baselineCount > 0 
      ? baselineTotalDuration / baselineCount 
      : 120; // Default 2 jam jika tidak ada data global

    // Hitung rata-rata per rute
    const routeAverages = new Map();
    routeBaselines.forEach((durations, routeKey) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      routeAverages.set(routeKey, avg);
    });

    console.log(`🌍 Global baseline: ${Math.round(globalBaselineDuration)} minutes`);
    console.log(`📊 Route-specific baselines: ${routeAverages.size} routes`);

    // 2. GET FILTERED TRIPS
    const trips = await prisma.trip.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            name: true
          }
        },
        vehicle: {
          select: {
            id: true,
            plate: true
          }
        },
        origin: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        destination: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        positions: {
          select: {
            speed: true
          },
          orderBy: { timestamp: "desc" },
          take: 1
        }
      },
      orderBy: { startTime: "desc" }
    });

    console.log(`✅ Found ${trips.length} trips for stats`);

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

    // FIRST PASS: Collect basic stats
    trips.forEach(trip => {
      // Count by status
      if (trip.status === "ON_TRIP") {
        onTrip++;
      } else if (trip.status === "COMPLETED") {
        completed++;
      }
      
      // Get speed
      let speed = 0;
      if (trip.avgSpeed !== null && trip.avgSpeed !== undefined) {
        speed = trip.avgSpeed;
      } else if (trip.positions?.[0]?.speed) {
        speed = trip.positions[0].speed;
      }
      
      if (speed > 0) {
        speeds.push(speed);
      }
      
      // Collect unique counts
      if (trip.driver?.id) driverSet.add(trip.driver.id);
      if (trip.vehicle?.id) vehicleSet.add(trip.vehicle.id);
      if (trip.origin && trip.destination) {
        const routeKey = `${trip.origin.name}-${trip.destination.name}`;
        routeSet.add(routeKey);
      }
    });

    // SECOND PASS: Calculate performance (mutually exclusive)
    trips.forEach(trip => {
      if (trip.status === "COMPLETED" && trip.startTime && trip.endTime) {
        const start = new Date(trip.startTime);
        const end = new Date(trip.endTime);
        const duration = (end - start) / (1000 * 60);
        
        // Hitung untuk rata-rata
        durations.push(duration);
        
        // Tentukan baseline yang tepat:
        // 1. Coba gunakan route-specific baseline jika ada
        // 2. Jika tidak, gunakan global baseline
        let baselineDuration = globalBaselineDuration;
        
        if (trip.originId && trip.destinationId) {
          const routeKey = `${trip.originId}-${trip.destinationId}`;
          if (routeAverages.has(routeKey)) {
            baselineDuration = routeAverages.get(routeKey);
          }
        }
        
        // LOGIKA MUTUALLY EXCLUSIVE dengan baseline yang konsisten
        const lowerBound = baselineDuration * 0.9;  // 90%
        const upperBound = baselineDuration * 1.1;  // 110%
        
        if (duration < lowerBound) {
          early++;      // HANYA Early
        } else if (duration <= upperBound) {
          onTime++;     // HANYA On Time
        } else {
          delay++;      // HANYA Delay
        }
        
        // Log untuk debugging
        console.log(`🔍 Trip ${trip.id}: ${duration.toFixed(0)}min vs baseline ${baselineDuration.toFixed(0)}min (${lowerBound.toFixed(0)}-${upperBound.toFixed(0)}) -> ${duration < lowerBound ? 'Early' : duration <= upperBound ? 'On Time' : 'Delay'}`);
      }
    });

    // Calculate averages
    const avgTripDuration = durations.length > 0 
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
      
    const avgSpeed = speeds.length > 0
      ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length)
      : 0;

    // Verifikasi konsistensi
    const performanceTotal = early + onTime + delay;
    if (performanceTotal !== completed) {
      console.warn(`⚠️ Performance sum mismatch! Completed: ${completed}, Sum: ${performanceTotal}`);
      // Adjust onTime to make them equal
      onTime = completed - early - delay;
    }

    console.log("📊 Final stats:", {
      totalTrips: trips.length,
      idle,
      onTrip,
      completed,
      onTime,
      delay,
      early,
      performanceSum: early + onTime + delay,
      avgTripDuration,
      avgSpeed,
      uniqueDrivers: driverSet.size,
      uniqueVehicles: vehicleSet.size,
      uniqueRoutes: routeSet.size,
      baselineUsed: `Global: ${Math.round(globalBaselineDuration)}min, Routes: ${routeAverages.size}`
    });

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