const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================
  // 1️⃣ CLEAR EXISTING DATA
  // ============================================
  // await prisma.assignment.deleteMany();
  // await prisma.status.deleteMany();
  // await prisma.position.deleteMany();
  // await prisma.vehicle.deleteMany();
  // await prisma.driver.deleteMany();
  // await prisma.route.deleteMany();
  // await prisma.origin.deleteMany();
  // await prisma.departure.deleteMany();
  // await prisma.user.deleteMany();
  // console.log("🧹 Database cleared.");

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
  // 3️⃣ DRIVERS & VEHICLES
  // ============================================
  // const driverNames = ["John Doe", "Jane Smith", "Bob Johnson"];
  // for (const name of driverNames) {
  //   await prisma.driver.create({ data: { name } });
  // }

  // const vehiclesData = [
  //   { name: "B 3420 ADZ", driver: "John Doe", route: null },
  //   { name: "B 4429 JJA", driver: "Jane Smith", route: null },
  //   { name: "B 4278 AKB", driver: "Bob Johnson", route: null },
  // ];

  // for (const v of vehiclesData) {
  //   await prisma.vehicle.create({ data: v });
  // }

  // console.log("🚚 Vehicles & Drivers inserted.");

  // ============================================
  // 4️⃣ ORIGIN & DEPARTURE SEED
  // ============================================
  // const cities = [
  //   "Jakarta", "Bandung", "Surabaya", "Malang", "Yogyakarta",
  //   "Semarang", "Medan", "Palembang", "Balikpapan", "Denpasar"
  // ];

  // for (const city of cities) {
  //   await prisma.origin.create({ data: { destination: city } });
  //   await prisma.departure.create({ data: { destination: city } });
  // }

  console.log("🛣️ Origins & Departures inserted.");

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
