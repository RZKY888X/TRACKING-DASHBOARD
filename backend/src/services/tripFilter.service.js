const prisma = require("../lib/prisma");
const { buildDateFilter } = require("../helpers/dateFilter");

async function getCascadeOptions({ dateType, dateValue, driverName, originName }) {
  const dateFilter = buildDateFilter(dateType, dateValue);
  const baseWhere = dateFilter;

  // =====================
  // DRIVERS
  // =====================
  let drivers = [];

  if (dateType === "current") {
    drivers = await prisma.driver.findMany({
      select: { id: true, name: true }
    });
  } else {
    const driverTrips = await prisma.trip.findMany({
      where: baseWhere,
      select: {
        driver: {
          select: { id: true, name: true }
        }
      },
      distinct: ["driverId"]
    });

    drivers = driverTrips.map(t => t.driver).filter(Boolean);
  }

  // =====================
  // ORIGINS
  // =====================
  let origins = [];

  if (drivers.length) {
    let originWhere = dateType === "current" ? {} : { ...baseWhere };

    if (driverName && !driverName.startsWith("Select")) {
      const clean = driverName.split("(")[0].trim();
      const driver = drivers.find(d => d.name === clean);
      if (driver) originWhere.driverId = driver.id;
    }

    const originTrips = await prisma.trip.findMany({
      where: originWhere,
      select: {
        origin: { select: { id: true, name: true, city: true } }
      },
      distinct: ["originId"]
    });

    origins = originTrips.map(t => t.origin).filter(Boolean);
  }

  // =====================
  // DESTINATIONS
  // =====================
  let destinations = [];

  if (origins.length) {
    let destWhere = dateType === "current" ? {} : { ...baseWhere };

    if (driverName && !driverName.startsWith("Select")) {
      const clean = driverName.split("(")[0].trim();
      const driver = drivers.find(d => d.name === clean);
      if (driver) destWhere.driverId = driver.id;
    }

    if (originName && !originName.startsWith("Select")) {
      const clean = originName.split("(")[0].trim();
      const origin = origins.find(o =>
        o.name === clean || `${o.name} (${o.city})` === originName
      );
      if (origin) destWhere.originId = origin.id;
    }

    destWhere.destinationId = { gt: 0 };

    const destTrips = await prisma.trip.findMany({
      where: destWhere,
      select: {
        destination: { select: { id: true, name: true, city: true } }
      },
      distinct: ["destinationId"]
    });

    destinations = destTrips.map(t => t.destination).filter(Boolean);
  }

  return {
    drivers,
    origins,
    destinations
  };
}

// ==========================
// FILTER TRIPS
// ==========================
async function filterTrips(params) {
  const {
    dateType,
    dateValue,
    driverName,
    originName,
    destinationName
  } = params;

  const dateFilter = buildDateFilter(dateType, dateValue);
  const where = { ...dateFilter };

  if (driverName && !driverName.startsWith("Select")) {
    const clean = driverName.split("(")[0].trim();
    where.driver = { name: { contains: clean, mode: "insensitive" } };
  }

  if (originName && !originName.startsWith("Select")) {
    const clean = originName.split("(")[0].trim();
    where.origin = { name: { contains: clean, mode: "insensitive" } };
  }

  if (destinationName && !destinationName.startsWith("Select")) {
    const clean = destinationName.split("(")[0].trim();
    where.destination = { name: { contains: clean, mode: "insensitive" } };
  }

  const trips = await prisma.trip.findMany({
    where,
    include: {
      driver: true,
      vehicle: true,
      origin: true,
      destination: true,
      positions: {
        orderBy: { timestamp: "desc" },
        take: 1
      }
    },
    orderBy: [
      { status: "desc" },
      { startTime: "desc" }
    ]
  });

  return trips.map(trip => {
    const latest = trip.positions?.[0];
    let speed = trip.avgSpeed ?? latest?.speed ?? 0;

    return {
      ...trip,
      latestPosition: latest,
      displaySpeed: speed
    };
  });
}

module.exports = {
  getCascadeOptions,
  filterTrips
};
