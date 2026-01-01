const prisma = require("../lib/prisma");

exports.getVehicles = () => {
  return prisma.vehicle.findMany({
    orderBy: { plate: "asc" }
  });
};

exports.createVehicle = (data) => {
  return prisma.vehicle.create({ data });
};
