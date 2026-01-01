const prisma = require("../lib/prisma");

exports.getWarehouses = () => {
  return prisma.warehouse.findMany({
    orderBy: { name: "asc" }
  });
};

exports.createWarehouse = (data) => {
  return prisma.warehouse.create({ data });
};
