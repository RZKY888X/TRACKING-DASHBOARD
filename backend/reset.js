const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Hapus data dari child tables dulu (karena foreign key)
  await prisma.position.deleteMany();
  await prisma.vehicleStatus.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.trip.deleteMany();
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
