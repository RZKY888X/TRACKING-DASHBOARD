const prisma = require("../lib/prisma");

async function writeActivityLog({
  userId,
  action,
  entity = null,
  entityId = null,
  description = "",
  req = null,
  metadata = null,
}) {
  try {
    if (process.env.ACTIVITY_LOGS_ENABLED === "false") return;

    const uid =
      typeof userId === "string" && userId.trim() !== "" ? userId : null;

    await prisma.activityLog.create({
      data: {
        userId: uid,
        action,
        entity,
        entityId: entityId != null ? String(entityId) : null,
        description,
        ipAddress: req?.ip || null,
        userAgent: req?.headers?.["user-agent"] || null,
        metadata: metadata || {},
      },
    });
  } catch (err) {
    console.error("Failed to write activity log:", err?.message || err);
  }
}

module.exports = { writeActivityLog };
