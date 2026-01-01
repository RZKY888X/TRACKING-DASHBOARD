const prisma = require("../lib/prisma");
const { writeActivityLog } = require("../utils/activityLog");

exports.getActivities = async (req) => {
  const {
    page = 1,
    limit = 20,
    userId,
    action,
    entity,
    startDate,
    endDate,
    search,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  // role-based filter
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN") {
    where.userId = req.user.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (action) where.action = action;
  if (entity) where.entity = entity;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { entity: { contains: search, mode: "insensitive" } },
      { action: { contains: search, mode: "insensitive" } },
      { ipAddress: { contains: search, mode: "insensitive" } },
      { userAgent: { contains: search, mode: "insensitive" } },
    ];
  }

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    }),
    prisma.activityLog.count({ where }),
  ]);

  await writeActivityLog({
    userId: req.user?.id,
    action: "READ",
    entity: "ACTIVITY_LOG",
    description: "Viewed activity logs",
    req,
  });

  return {
    activities,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

exports.getActivityById = async (req) => {
  const { id } = req.params;

  const log = await prisma.activityLog.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!log) {
    throw { status: 404, message: "Activity log not found" };
  }

  await writeActivityLog({
    userId: req.user?.id,
    action: "READ",
    entity: "ACTIVITY_LOG",
    entityId: id,
    description: `Viewed activity log ${id}`,
    req,
  });

  return log;
};
