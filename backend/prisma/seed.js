// prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================
  // 1️⃣ CLEAR EXISTING DATA
  // ============================================
  await prisma.assignment.deleteMany();
  await prisma.status.deleteMany();
  await prisma.position.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();
  console.log("🧹 Database cleared.");

  // ============================================
  // 2️⃣ USER SEED
  // ============================================
  const usersData = [
    { email: "viewer@example.com",      password: "Pw123", name: "Viewer User", role: "VIEWER", jobRole: "Viewer" },
    { email: "user@example.com",        password: "Pw123", name: "Regular User", role: "USER", jobRole: "Driver" },
    { email: "admin@example.com",       password: "Pw123", name: "Admin User", role: "ADMIN", jobRole: "Supervisor" },
    { email: "superadmin@example.com",  password: "Pw123", name: "Super Admin", role: "SUPERADMIN", jobRole: "Admin" },
  ];

  const users = [];
  for (const u of usersData) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const createdUser = await prisma.user.create({
      data: { ...u, password: hashedPassword },
    });
    users.push(createdUser);
  }
  console.log("👥 Users inserted:", users.length);

  // ============================================
  // 3️⃣ DRIVERS & ROUTES
  // ============================================
  const driverNames = ["John Doe", "Jane Smith", "Bob Johnson"];
  const drivers = [];
  for (const name of driverNames) {
    const d = await prisma.driver.create({ data: { name } });
    drivers.push(d);
  }

  const routeData = [
    { name: "Route 1", origin: "Jakarta", departure: "Bandung" },
    { name: "Route 2", origin: "Surabaya", departure: "Malang" },
    { name: "Route 3", origin: "Yogyakarta", departure: "Semarang" },
  ];

  const routes = [];
  for (const r of routeData) {
    const route = await prisma.route.create({ data: r });
    routes.push(route);
  }

  // ============================================
  // 4️⃣ VEHICLES
  // ============================================
  const vehiclesData = [
    { name: "Truck A", driver: "John Doe", route: "Route 1" },
    { name: "Truck B", driver: "Jane Smith", route: "Route 2" },
    { name: "Van C",   driver: "Bob Johnson", route: "Route 3" },
    { name: "Bus D",   driver: "John Doe", route: "Route 1" },
    { name: "Car E",   driver: "Jane Smith", route: "Route 2" },
  ];

  const insertedVehicles = [];
  for (const v of vehiclesData) {
    const vehicle = await prisma.vehicle.create({ data: v });
    insertedVehicles.push(vehicle);
  }
  console.log("🚚 Vehicles, Drivers & Routes inserted.");

  // ============================================
  // 5️⃣ MOCK TELEMETRY DATA
  // ============================================
  const positions = [];
  const statuses = [];

  insertedVehicles.forEach((vehicle) => {
    positions.push({
      vehicleId: vehicle.id,
      latitude: -6.200 + Math.random() * 0.2,
      longitude: 106.800 + Math.random() * 0.2,
      speed: Math.floor(Math.random() * 120),
    });

    statuses.push({
      vehicleId: vehicle.id,
      isOnline: true,
      battery: Math.floor(Math.random() * 100),
    });
  });

  await prisma.position.createMany({ data: positions });
  await prisma.status.createMany({ data: statuses });
  console.log(`📍 Telemetry mock added for ${insertedVehicles.length} vehicles.`);

  // ============================================
  // 6️⃣ MOCK ASSIGNMENT DATA
  // ============================================
  const assignmentsData = [
    {
      userId: users[1].id, // Regular User
      vehicleId: insertedVehicles[0].id,
      fromId: routes[0].id,
      toId: routes[1].id,
      jobRole: "Driver",
    },
    {
      userId: users[2].id, // Admin User
      vehicleId: insertedVehicles[1].id,
      fromId: routes[1].id,
      toId: routes[2].id,
      jobRole: "Supervisor",
    },
  ];

  for (const a of assignmentsData) {
    await prisma.assignment.create({ data: a });
  }

  console.log("📌 Assignments inserted:", assignmentsData.length);

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Error seeding:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
