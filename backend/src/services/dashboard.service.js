const prisma = require("../lib/prisma");

// ================= MAP =================
async function getMapData() {
  return prisma.trip.findMany({
    where: { status: "ON_TRIP" },
    include: {
      assignment: {
        include: {
          driver: true,
          origin: true,
          destination: true,
          vehicle: {
            include: {
              positions: {
                take: 1,
                orderBy: { timestamp: "desc" }
              },
              statuses: {
                take: 1,
                orderBy: { timestamp: "desc" }
              }
            }
          }
        }
      }
    }
  });
}

// ================= ACTIVE TRIPS =================
async function getActiveTrips() {
  const trips = await prisma.trip.findMany({
    where: { status: "ON_TRIP" },
    include: {
      driver: true,
      vehicle: true,
      origin: true,
      destination: true
    }
  });

  const colors = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#F39C12",
    "#9B59B6",
    "#1ABC9C"
  ];

  return trips.map((trip, index) => ({
    tripId: trip.id,
    color: colors[index % colors.length],

    driver: {
      id: trip.driver.id,
      name: trip.driver.name
    },

    vehicle: {
      id: trip.vehicle.id,
      plate: trip.vehicle.plate
    },

    origin: {
      id: trip.origin.id,
      name: trip.origin.name,
      lat: trip.origin.latitude,
      lng: trip.origin.longitude
    },

    destination: {
      id: trip.destination.id,
      name: trip.destination.name,
      lat: trip.destination.latitude,
      lng: trip.destination.longitude
    }
  }));
}

// ================= LIVE POSITIONS =================
async function getLivePositions() {
  const trips = await prisma.trip.findMany({
    where: { status: "ON_TRIP" },
    include: {
      driver: true,
      vehicle: {
        include: {
          positions: {
            take: 1,
            orderBy: { timestamp: "desc" }
          }
        }
      }
    }
  });

  return trips
    .filter(t => t.vehicle.positions.length)
    .map(t => {
      const pos = t.vehicle.positions[0];

      return {
        tripId: t.id,
        vehicleId: t.vehicle.id,
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed,
        driver: t.driver.name,
        plate: t.vehicle.plate,
        timestamp: pos.timestamp
      };
    });
}

// ================= DASHBOARD STATS =================
async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeVehicles,
    tripsToday,
    scheduledTrips,
    completedTrips,
    delayedTrips
  ] = await Promise.all([
    prisma.trip.groupBy({
      by: ["vehicleId"],
      where: { status: "ON_TRIP" }
    }),
    prisma.trip.count({ where: { startTime: { gte: today } } }),
    prisma.assignment.count({ where: { createdAt: { gte: today } } }),
    prisma.trip.count({ where: { status: "COMPLETED" } }),
    prisma.trip.count({
      where: { status: "COMPLETED", avgSpeed: { lt: 40 } }
    })
  ]);

  const onTimePerformance =
    completedTrips === 0 ? 0 : ((completedTrips - delayedTrips) / completedTrips) * 100;

  const delayRate =
    completedTrips === 0 ? 0 : (delayedTrips / completedTrips) * 100;

  return {
    activeVehicles: activeVehicles.length,
    activeVehiclesChange: "+2.5%",
    tripsToday,
    scheduledTrips,
    onTimePerformance: Number(onTimePerformance.toFixed(1)),
    delayRate: Number(delayRate.toFixed(1))
  };
}

// ================= PERFORMANCE =================
async function getPerformance(range = "7d") {
  const now = new Date();
  const startDate = new Date();

  if (range === "30d") startDate.setDate(now.getDate() - 29);
  else startDate.setDate(now.getDate() - 6);

  startDate.setHours(0, 0, 0, 0);

  const trips = await prisma.trip.findMany({
    where: {
      status: "COMPLETED",
      endTime: { gte: startDate }
    },
    select: { endTime: true, avgSpeed: true }
  });

  const dayMap = {};
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totalDays = range === "30d" ? 30 : 7;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = d.toISOString().split("T")[0];
    dayMap[key] = { name: dayNames[d.getDay()], onTime: 0, delay: 0 };
  }

  for (const trip of trips) {
    if (!trip.endTime || trip.avgSpeed === null) continue;
    const key = trip.endTime.toISOString().split("T")[0];
    if (!dayMap[key]) continue;

    if (trip.avgSpeed >= 40) dayMap[key].onTime++;
    else dayMap[key].delay++;
  }

  const result = Object.values(dayMap);

  return {
    data: result,
    average: {
      onTime: Math.round(result.reduce((a, b) => a + b.onTime, 0) / result.length),
      delay: Math.round(result.reduce((a, b) => a + b.delay, 0) / result.length)
    }
  };
}

// ================= TRIP STATUS =================
async function getTripStatus() {
  const trips = await prisma.trip.findMany({
    select: { status: true, avgSpeed: true }
  });

  let onTime = 0, delayed = 0, atRisk = 0;

  for (const trip of trips) {
    if (trip.status === "ONGOING") atRisk++;
    else if (trip.status === "COMPLETED") {
      if (trip.avgSpeed >= 40) onTime++;
      else delayed++;
    }
  }

  const total = onTime + delayed + atRisk || 1;

  return {
    data: [
      { name: "On Time", value: Math.round((onTime / total) * 100), color: "#10b981" },
      { name: "Delayed", value: Math.round((delayed / total) * 100), color: "#3b82f6" },
      { name: "At Risk", value: Math.round((atRisk / total) * 100), color: "#ef4444" }
    ]
  };
}

module.exports = {
  getMapData,
  getActiveTrips,
  getLivePositions,
  getDashboardStats,
  getPerformance,
  getTripStatus
};
