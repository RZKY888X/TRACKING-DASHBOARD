const prisma = require("../lib/prisma");

exports.getDrivers = () => {
  return prisma.driver.findMany({
    orderBy: { name: "asc" }
  });
};

exports.createDriver = (data) => {
  return prisma.driver.create({ data });
};
