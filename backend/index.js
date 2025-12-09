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
   ASSIGNMENT APIs
====================================================== */

// GET users for assignment dropdown
app.get("/api/assignment/users", authMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, jobRole: true },
      orderBy: { createdAt: "desc" },
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

// GET: Get all assignments (with related data)
app.get("/api/assignments", authMiddleware, async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            jobRole: true
          }
        },
        vehicle: {
          select: {
            id: true,
            name: true
          }
        },
        fromOrigin: {
          select: {
            id: true,
            destination: true
          }
        },
        toDeparture: {
          select: {
            id: true,
            destination: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "ASSIGNMENT",
      description: "Viewed all assignments",
      req
    });

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Create new assignment dengan update vehicle route
app.post("/api/assignments", authMiddleware, async (req, res) => {
  try {
    console.log("📝 Received assignment data:", req.body);
    
    const { 
      fullName, 
      email, 
      jobRole, 
      vehicle, 
      routeFrom, 
      routeTo 
    } = req.body;

    // Validate required fields
    if (!fullName || !vehicle) {
      console.log("❌ Validation failed - Missing fullName or vehicle");
      return res.status(400).json({ 
        error: "Nama lengkap dan kendaraan harus diisi" 
      });
    }

    // 1. Find user by name (exact match)
    const user = await prisma.user.findFirst({
      where: { 
        name: fullName 
      }
    });

    if (!user) {
      console.log("❌ User not found:", fullName);
      return res.status(404).json({ 
        error: `User dengan nama "${fullName}" tidak ditemukan` 
      });
    }

    console.log("✅ Found user:", user.name, user.email);

    // 2. Find or create vehicle by name
    let vehicleRecord = await prisma.vehicle.findFirst({
      where: { 
        name: vehicle 
      }
    });

    if (!vehicleRecord) {
      console.log("🆕 Creating new vehicle:", vehicle);
      vehicleRecord = await prisma.vehicle.create({
        data: {
          name: vehicle,
          driver: user.name
        }
      });
    }

    console.log("✅ Vehicle record:", vehicleRecord.name);

    // 3. Find or create origin
    let origin = null;
    if (routeFrom) {
      origin = await prisma.origin.findFirst({
        where: { 
          destination: routeFrom 
        }
      });

      if (!origin) {
        console.log("🆕 Creating new origin:", routeFrom);
        origin = await prisma.origin.create({
          data: { 
            destination: routeFrom 
          }
        });
      }
    }

    // 4. Find or create departure
    let departure = null;
    if (routeTo) {
      departure = await prisma.departure.findFirst({
        where: { 
          destination: routeTo 
        }
      });

      if (!departure) {
        console.log("🆕 Creating new departure:", routeTo);
        departure = await prisma.departure.create({
          data: { 
            destination: routeTo 
          }
        });
      }
    }

    // 5. Create route string dari routeFrom dan routeTo
    let routeText = "";
    if (routeFrom && routeTo) {
      routeText = `${routeFrom} - ${routeTo}`;
    } else if (routeFrom) {
      routeText = routeFrom;
    } else if (routeTo) {
      routeText = routeTo;
    }

    console.log("🛣️ Generated route text:", routeText);

    // 6. Update vehicle dengan driver dan route baru
    await prisma.vehicle.update({
      where: { id: vehicleRecord.id },
      data: { 
        driver: user.name,
        route: routeText
      }
    });

    console.log("✅ Updated vehicle with route:", routeText);

    // 7. Create the assignment
    console.log("🔨 Creating assignment...");
    const assignment = await prisma.assignment.create({
      data: {
        userId: user.id,
        vehicleId: vehicleRecord.id,
        jobRole: jobRole || user.jobRole || "Driver",
        fromOriginId: origin ? origin.id : null,
        toDepartureId: departure ? departure.id : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            jobRole: true
          }
        },
        vehicle: {
          select: {
            id: true,
            name: true,
            driver: true,
            route: true
          }
        },
        fromOrigin: {
          select: {
            id: true,
            destination: true
          }
        },
        toDeparture: {
          select: {
            id: true,
            destination: true
          }
        }
      }
    });

    console.log("✅ Assignment created successfully:", assignment.id);

    // Log activity
    await writeActivityLog({
      userId: req.user?.id,
      action: "CREATE",
      entity: "ASSIGNMENT",
      entityId: String(assignment.id),
      description: `Created assignment for ${user.name} with vehicle ${vehicle}`,
      req,
      metadata: {
        userName: user.name,
        vehicle: vehicle,
        routeFrom: routeFrom,
        routeTo: routeTo,
        route: routeText
      }
    });

    res.status(201).json({
      success: true,
      message: "Assignment berhasil dibuat",
      assignment
    });

  } catch (err) {
    console.error("❌ Assignment creation error:", err);
    
    if (err.code === 'P2002') {
      return res.status(400).json({ 
        error: "Data sudah ada atau duplikat" 
      });
    }
    
    res.status(500).json({ 
      error: err.message || "Gagal membuat assignment" 
    });
  }
});

// GET: Get single assignment by ID
app.get("/api/assignments/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            jobRole: true
          }
        },
        vehicle: {
          select: {
            id: true,
            name: true,
            driver: true,
            route: true
          }
        },
        fromOrigin: {
          select: {
            id: true,
            destination: true
          }
        },
        toDeparture: {
          select: {
            id: true,
            destination: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ 
        error: "Assignment tidak ditemukan" 
      });
    }

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "ASSIGNMENT",
      entityId: id,
      description: `Viewed assignment ${id}`,
      req
    });

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ 
      error: err.message 
    });
  }
});

// PUT: Update assignment dengan update vehicle route
app.put("/api/assignments/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      userId, 
      vehicleId, 
      jobRole, 
      routeFrom, 
      routeTo 
    } = req.body;

    // Check if assignment exists
    const existing = await prisma.assignment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Assignment tidak ditemukan" });
    }

    // Find origin if routeFrom provided
    let fromOriginId = existing.fromOriginId;
    if (routeFrom) {
      let origin = await prisma.origin.findFirst({
        where: { destination: routeFrom }
      });

      if (!origin) {
        origin = await prisma.origin.create({
          data: { destination: routeFrom }
        });
      }
      fromOriginId = origin.id;
    }

    // Find departure if routeTo provided
    let toDepartureId = existing.toDepartureId;
    if (routeTo) {
      let departure = await prisma.departure.findFirst({
        where: { destination: routeTo }
      });

      if (!departure) {
        departure = await prisma.departure.create({
          data: { destination: routeTo }
        });
      }
      toDepartureId = departure.id;
    }

    // Update assignment
    const updated = await prisma.assignment.update({
      where: { id: parseInt(id) },
      data: {
        userId: userId || existing.userId,
        vehicleId: vehicleId || existing.vehicleId,
        jobRole: jobRole || existing.jobRole,
        fromOriginId,
        toDepartureId
      },
      include: {
        user: true,
        vehicle: true,
        fromOrigin: true,
        toDeparture: true
      }
    });

    // Update vehicle route berdasarkan assignment yang diupdate
    let routeText = "";
    if (routeFrom && routeTo) {
      routeText = `${routeFrom} - ${routeTo}`;
    } else if (routeFrom) {
      routeText = routeFrom;
    } else if (routeTo) {
      routeText = routeTo;
    }

    if (routeText) {
      await prisma.vehicle.update({
        where: { id: updated.vehicleId },
        data: { route: routeText }
      });
    }

    await writeActivityLog({
      userId: req.user?.id,
      action: "UPDATE",
      entity: "ASSIGNMENT",
      entityId: id,
      description: `Updated assignment ${id}`,
      req,
      metadata: req.body
    });

    res.json({
      success: true,
      message: "Assignment berhasil diperbarui",
      assignment: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Delete assignment
app.delete("/api/assignments/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if exists
    const existing = await prisma.assignment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ 
        success: false,
        error: "Assignment tidak ditemukan" 
      });
    }

    await prisma.assignment.delete({
      where: { id: parseInt(id) }
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "DELETE",
      entity: "ASSIGNMENT",
      entityId: id,
      description: `Deleted assignment ${id}`,
      req
    });

    res.json({
      success: true,
      message: "Assignment berhasil dihapus"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// GET: Get assignments by user ID
app.get("/api/assignments/user/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const assignments = await prisma.assignment.findMany({
      where: { userId },
      include: {
        vehicle: true,
        fromOrigin: true,
        toDeparture: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

/* ======================================================
   VEHICLE APIs (Protected) - DIPERBAIKI
====================================================== */
app.get("/api/vehicles", authMiddleware, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { 
        positions: { orderBy: { timestamp: "desc" }, take: 1 },
        assignments: {
          include: {
            fromOrigin: true,
            toDeparture: true
          },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
    });

    // Format route dari assignment jika ada
    const formattedVehicles = vehicles.map(vehicle => {
      let route = vehicle.route;
      
      // Jika ada assignment, ambil route dari assignment
      if (vehicle.assignments && vehicle.assignments.length > 0) {
        const assignment = vehicle.assignments[0];
        const from = assignment.fromOrigin?.destination;
        const to = assignment.toDeparture?.destination;
        
        if (from && to) {
          route = `${from} - ${to}`;
        } else if (from) {
          route = from;
        } else if (to) {
          route = to;
        }
      }

      return {
        ...vehicle,
        route: route
      };
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "VEHICLE",
      description: "Viewed vehicle list",
      req,
    });

    res.json(formattedVehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/vehicles/latest", authMiddleware, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { 
        positions: { orderBy: { timestamp: "desc" }, take: 1 },
        assignments: {
          include: {
            fromOrigin: true,
            toDeparture: true
          },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
    });

    const flat = vehicles.map((v) => {
      // Ambil route dari assignment jika ada
      let route = v.route;
      if (v.assignments && v.assignments.length > 0) {
        const assignment = v.assignments[0];
        const from = assignment.fromOrigin?.destination;
        const to = assignment.toDeparture?.destination;
        
        if (from && to) {
          route = `${from} - ${to}`;
        } else if (from) {
          route = from;
        } else if (to) {
          route = to;
        }
      }

      return {
        id: v.id,
        name: v.name,
        driver: v.driver,
        route: route, // Route yang sudah digabungkan
        latitude: v.positions[0]?.latitude || null,
        longitude: v.positions[0]?.longitude || null,
        speed: v.positions[0]?.speed || 0,
        timestamp: v.positions[0]?.timestamp || null,
      };
    });

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
      entityId: String(vehicle.id),
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
      data: { vehicleId, latitude, longitude, speed },
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "CREATE",
      entity: "POSITION",
      entityId: String(pos.id),
      description: `New vehicle position for vehicleId ${vehicleId}`,
      req,
    });

    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   ORIGINS & DEPARTURES APIs (PUBLIC)
====================================================== */
// GET origins (no auth)
app.get("/api/origins/public", async (req, res) => {
  try {
    const origins = await prisma.origin.findMany({
      select: { id: true, destination: true },
      orderBy: { destination: "asc" },
    });

    await writeActivityLog({
      userId: null, // public
      action: "READ",
      entity: "ORIGIN",
      description: "Fetched origins list (public)",
      req,
    });

    res.json(origins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET departures (no auth)
app.get("/api/departures/public", async (req, res) => {
  try {
    const departures = await prisma.departure.findMany({
      select: { id: true, destination: true },
      orderBy: { destination: "asc" },
    });

    await writeActivityLog({
      userId: null, // public
      action: "READ",
      entity: "DEPARTURE",
      description: "Fetched departures list (public)",
      req,
    });

    res.json(departures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   FILTER DATA APIs
====================================================== */

// GET: Get all unique drivers from vehicles
app.get("/api/filters/drivers", authMiddleware, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      select: { driver: true },
      where: { driver: { not: null } },
      distinct: ['driver']
    });

    const drivers = vehicles
      .map(v => v.driver)
      .filter(driver => driver && driver.trim() !== "")
      .sort();

    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Get all unique routes (split from vehicle.route field)
app.get("/api/filters/routes", authMiddleware, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      select: { route: true },
      where: { route: { not: null } }
    });

    const routes = new Set();
    
    vehicles.forEach(vehicle => {
      if (vehicle.route) {
        // Split combined routes like "Jakarta - Malang"
        const routeParts = vehicle.route.split(' - ');
        routeParts.forEach(part => {
          if (part.trim()) {
            routes.add(part.trim());
          }
        });
      }
    });

    res.json(Array.from(routes).sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Get all origins from origin table
app.get("/api/filters/origins", async (req, res) => {
  try {
    const origins = await prisma.origin.findMany({
      select: { destination: true },
      orderBy: { destination: 'asc' }
    });

    const originList = origins.map(o => o.destination);
    res.json(originList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Get all departures from departure table
app.get("/api/filters/departures", async (req, res) => {
  try {
    const departures = await prisma.departure.findMany({
      select: { destination: true },
      orderBy: { destination: 'asc' }
    });

    const departureList = departures.map(d => d.destination);
    res.json(departureList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Get all unique values for filters (combined)
app.get("/api/filters/all", authMiddleware, async (req, res) => {
  try {
    // Get drivers
    const vehicles = await prisma.vehicle.findMany({
      select: { driver: true },
      where: { driver: { not: null } },
      distinct: ['driver']
    });

    const drivers = vehicles
      .map(v => v.driver)
      .filter(driver => driver && driver.trim() !== "")
      .sort();

    // Get origins
    const origins = await prisma.origin.findMany({
      select: { destination: true },
      orderBy: { destination: 'asc' }
    });

    const originList = origins.map(o => o.destination);

    // Get departures
    const departures = await prisma.departure.findMany({
      select: { destination: true },
      orderBy: { destination: 'asc' }
    });

    const departureList = departures.map(d => d.destination);

    res.json({
      drivers,
      origins: originList,
      departures: departureList,
      routes: [...originList, ...departureList].filter((v, i, a) => a.indexOf(v) === i).sort()
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// backend/index.js - Tambahkan API berikut:

// GET: Get all unique drivers (dari tabel Vehicle)
app.get("/api/filters/drivers", authMiddleware, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      select: { driver: true },
      where: { driver: { not: null } },
      distinct: ['driver']
    });

    const drivers = vehicles
      .map(v => v.driver)
      .filter(driver => driver && driver.trim() !== "")
      .sort();

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "FILTER",
      description: "Fetched drivers for filter",
      req,
    });

    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Get all unique routes (dari tabel Vehicle.route dan Assignment)
app.get("/api/filters/routes", authMiddleware, async (req, res) => {
  try {
    // Ambil dari vehicle.route
    const vehicles = await prisma.vehicle.findMany({
      select: { route: true },
      where: { route: { not: null } }
    });

    // Ambil dari assignment (origin + departure)
    const assignments = await prisma.assignment.findMany({
      include: {
        fromOrigin: { select: { destination: true } },
        toDeparture: { select: { destination: true } }
      }
    });

    const routeSet = new Set();
    
    // Tambahkan dari vehicle.route
    vehicles.forEach(vehicle => {
      if (vehicle.route && vehicle.route.includes(" - ")) {
        const [from, to] = vehicle.route.split(" - ");
        routeSet.add(from.trim());
        routeSet.add(to.trim());
      } else if (vehicle.route) {
        routeSet.add(vehicle.route.trim());
      }
    });

    // Tambahkan dari assignment
    assignments.forEach(assignment => {
      if (assignment.fromOrigin?.destination) {
        routeSet.add(assignment.fromOrigin.destination);
      }
      if (assignment.toDeparture?.destination) {
        routeSet.add(assignment.toDeparture.destination);
      }
    });

    const routes = Array.from(routeSet).sort();

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "FILTER",
      description: "Fetched routes for filter",
      req,
    });

    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Vehicle data with filters
app.get("/api/vehicles/filtered", authMiddleware, async (req, res) => {
  try {
    const { driver, route, departure, dateType, dateValue } = req.query;

    // Base query
    const where = {};

    // Filter by driver
    if (driver) {
      where.driver = { contains: driver, mode: "insensitive" };
    }

    // Filter by route (from vehicle.route or assignment)
    if (route) {
      where.OR = [
        { route: { contains: route, mode: "insensitive" } },
        {
          assignments: {
            some: {
              OR: [
                { fromOrigin: { destination: { contains: route, mode: "insensitive" } } },
                { toDeparture: { destination: { contains: route, mode: "insensitive" } } }
              ]
            }
          }
        }
      ];
    }

    // Filter by departure (specific to departure table)
    if (departure) {
      where.assignments = {
        some: {
          toDeparture: { destination: { contains: departure, mode: "insensitive" } }
        }
      };
    }

    // Date filter logic
    if (dateType && dateValue && dateValue !== "Current") {
      const today = new Date();
      let startDate, endDate;

      if (dateType === "daily") {
        startDate = new Date(dateValue);
        endDate = new Date(dateValue);
        endDate.setDate(endDate.getDate() + 1);
      } else if (dateType === "weekly") {
        // Parse week string like "2024-01 Week 2"
        const match = dateValue.match(/(\d{4}-\d{2}).*Week\s*(\d+)/i);
        if (match) {
          const [_, monthStr, weekNum] = match;
          const yearMonth = monthStr.split('-');
          const year = parseInt(yearMonth[0]);
          const month = parseInt(yearMonth[1]) - 1;
          const week = parseInt(weekNum);
          
          // Simple week calculation (approximate)
          const firstDay = new Date(year, month, 1);
          const dayOffset = (week - 1) * 7;
          startDate = new Date(firstDay);
          startDate.setDate(firstDay.getDate() + dayOffset);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
        }
      } else if (dateType === "monthly") {
        const yearMonth = dateValue.split('-');
        const year = parseInt(yearMonth[0]);
        const month = parseInt(yearMonth[1]) - 1;
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
      }

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate
        };
      }
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        positions: { 
          orderBy: { timestamp: "desc" }, 
          take: 1 
        },
        assignments: {
          include: {
            fromOrigin: true,
            toDeparture: true
          },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Format vehicles dengan route dari assignment
    const formattedVehicles = vehicles.map(vehicle => {
      let displayRoute = vehicle.route;
      
      // Jika ada assignment, gabungkan origin dan departure
      if (vehicle.assignments && vehicle.assignments.length > 0) {
        const assignment = vehicle.assignments[0];
        const from = assignment.fromOrigin?.destination;
        const to = assignment.toDeparture?.destination;
        
        if (from && to) {
          displayRoute = `${from} - ${to}`;
        } else if (from) {
          displayRoute = from;
        } else if (to) {
          displayRoute = to;
        }
      }

      return {
        ...vehicle,
        route: displayRoute,
        latitude: vehicle.positions[0]?.latitude || null,
        longitude: vehicle.positions[0]?.longitude || null,
        speed: vehicle.positions[0]?.speed || null,
        timestamp: vehicle.positions[0]?.timestamp || null
      };
    });

    await writeActivityLog({
      userId: req.user?.id,
      action: "READ",
      entity: "VEHICLE",
      description: `Filtered vehicles with params: ${JSON.stringify(req.query)}`,
      req,
    });

    res.json(formattedVehicles);
  } catch (err) {
    console.error("Filter error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   START SERVER
====================================================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Assignment API available at: http://localhost:${PORT}/api/assignments`);
  console.log(`🚗 Vehicle API available at: http://localhost:${PORT}/api/vehicles/latest`);
});