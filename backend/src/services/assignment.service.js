const prisma = require("../lib/prisma");

exports.createAssignment = (data) => {
  return prisma.assignment.create({
    data: {
      driverId: data.driverId,
      vehicleId: data.vehicleId,
      originId: data.originId,
      destinationId: data.destinationId,
      status: "PENDING"
    }
  });
};

exports.getAssignments = () => {
  return prisma.assignment.findMany({
    include: {
      order: { include: { origin: true, destination: true } },
      driver: true,
      vehicle: true
    }
  });
};
