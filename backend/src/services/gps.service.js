const prisma = require("../lib/prisma");

exports.pushGPS = async ({ vehicleId, latitude, longitude, speed }) => {
  const assignment = await prisma.assignment.findFirst({
    where: {
      vehicleId,
      status: "STARTED"
    },
    include: { trip: true }
  });

  if (!assignment || !assignment.trip) {
    throw new Error("No active trip for vehicle");
  }

  return prisma.position.create({
    data: {
      tripId: assignment.trip.id,
      vehicleId: assignment.vehicleId,
      latitude,
      longitude,
      speed
    }
  });
};
