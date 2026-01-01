const prisma = require("../lib/prisma");

exports.createOrder = (data) => {
  return prisma.order.create({ data });
};

exports.getOrders = () => {
  return prisma.order.findMany({
    include: { origin: true, destination: true }
  });
};
