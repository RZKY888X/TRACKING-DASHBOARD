// prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================
  // 1️⃣ CLEAR EXISTING DATA (RESET)
  // ============================================
  await prisma.status.deleteMany();
  await prisma.position.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Database cleared.");


  // ============================================
  // 2️⃣ USER SEED (REAL DATA — DO NOT REMOVE)
  // ============================================

  const hashedPassword = await bcrypt.hash("Pw123", 10);

  const users = [
    { email: "viewer@example.com",      password: hashedPassword, name: "Viewer User", role: "VIEWER" },
    { email: "user@example.com",        password: hashedPassword, name: "Regular User", role: "USER" },
    { email: "admin@example.com",       password: hashedPassword, name: "Admin User", role: "ADMIN" },
    { email: "superadmin@example.com",  password: hashedPassword, name: "Super Admin", role: "SUPERADMIN" },
  ];

  await prisma.user.createMany({ data: users });

  console.log("👥 Users inserted:", users.length);


  // ============================================
  // 3️⃣ MASTER DATA (Driver + Route + Vehicle)
  // ============================================

  const driverNames = ["John Doe", "Jane Smith", "Bob Johnson"];
  const routeNames = [
    "Route 1 - Jakarta to Bandung",
    "Route 2 - Surabaya to Malang",
    "Route 3 - Yogyakarta to Semarang",
  ];

  await prisma.driver.createMany({
    data: driverNames.map((name) => ({ name })),
  });

  await prisma.route.createMany({
    data: routeNames.map((name) => ({ name })),
  });

  const vehiclesData = [
    { name: "Truck A", driver: "John Doe", route: routeNames[0] },
    { name: "Truck B", driver: "Jane Smith", route: routeNames[1] },
    { name: "Van C",   driver: "Bob Johnson", route: routeNames[2] },
    { name: "Bus D",   driver: "John Doe", route: routeNames[0] },
    { name: "Car E",   driver: "Jane Smith", route: routeNames[1] },
  ];

  await prisma.vehicle.createMany({ data: vehiclesData });

  console.log("🚚 Vehicles, Drivers & Routes inserted.");


  // ============================================
  // 4️⃣ MOCK TELEMETRY DATA (TEMPORARY UNTIL MQTT/LORAWAN)
  // ============================================

  const insertedVehicles = await prisma.vehicle.findMany();

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
  // 5️⃣ FUTURE SOURCE (MQTT / LoRaWAN)
  // ============================================
  // Uncomment when live data connected:
  //
  // mqtt.subscribe("lorawan/device/+/data");
  // mqtt.on("message", async (payload) => {
  //     await prisma.position.create(...);
  //     await prisma.status.update(...);
  // });
  //

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
