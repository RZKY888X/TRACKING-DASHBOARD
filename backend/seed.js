// backend/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Insert Driver
  await prisma.driver.createMany({
    data: [
      { name: 'John Doe' },
      { name: 'Jane Smith' },
      { name: 'Bob Johnson' },
    ],
  });

  // Insert Route
  await prisma.route.createMany({
    data: [
      { name: 'Route 1 - Jakarta to Bandung' },
      { name: 'Route 2 - Surabaya to Malang' },
      { name: 'Route 3 - Yogyakarta to Semarang' },
    ],
  });

  // Insert Vehicle
  await prisma.vehicle.createMany({
    data: [
      { name: 'Truck A', driver: 'John Doe', route: 'Route 1 - Jakarta to Bandung' },
      { name: 'Truck B', driver: 'Jane Smith', route: 'Route 2 - Surabaya to Malang' },
      { name: 'Van C', driver: 'Bob Johnson', route: 'Route 3 - Yogyakarta to Semarang' },
      { name: 'Bus D', driver: 'John Doe', route: 'Route 1 - Jakarta to Bandung' },
      { name: 'Car E', driver: 'Jane Smith', route: 'Route 2 - Surabaya to Malang' },
    ],
  });

  // Insert Position
  await prisma.position.createMany({
    data: [
      { vehicleId: 1, latitude: -6.2088, longitude: 106.8456, speed: 60.5 },
      { vehicleId: 1, latitude: -6.2500, longitude: 106.8500, speed: 55.0 },
      { vehicleId: 2, latitude: -7.2575, longitude: 112.7521, speed: 45.2 },
      { vehicleId: 3, latitude: -7.7956, longitude: 110.3695, speed: 30.0 },
      { vehicleId: 4, latitude: -6.2088, longitude: 106.8456, speed: 70.0 },
      { vehicleId: 5, latitude: -7.2575, longitude: 112.7521, speed: 50.5 },
    ],
  });

  // Insert Status
  await prisma.status.createMany({
    data: [
      { vehicleId: 1, isOnline: true, battery: 85 },
      { vehicleId: 2, isOnline: true, battery: 90 },
      { vehicleId: 3, isOnline: false, battery: 20 },
      { vehicleId: 4, isOnline: true, battery: 75 },
      { vehicleId: 5, isOnline: true, battery: 95 },
    ],
  });

  console.log('Dummy data inserted successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());