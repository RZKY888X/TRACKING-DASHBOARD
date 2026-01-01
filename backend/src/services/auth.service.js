const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { writeActivityLog } = require("../utils/activityLog");

exports.register = async (req) => {
  const { email, password, name, role, jobRole } = req.body;

  if (!email || !password || !name) {
    throw { status: 400, message: "Email, password, and name are required" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw { status: 400, message: "User already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || "VIEWER",
      jobRole,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      jobRole: true,
      createdAt: true,
    },
  });

  await writeActivityLog({
    userId: req.user?.id,
    action: "CREATE",
    entity: "USER",
    entityId: user.id,
    description: `Created new user: ${user.email}`,
    req,
  });

  return { success: true, user };
};

exports.login = async (req) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw { status: 400, message: "Email and password required" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await writeActivityLog({
      action: "LOGIN_FAILED",
      entity: "USER",
      description: `Login failed for email: ${email}`,
      req,
    });
    throw { status: 401, message: "Invalid credentials" };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    await writeActivityLog({
      userId: user.id,
      action: "LOGIN_FAILED",
      entity: "USER",
      entityId: user.id,
      description: "Wrong password",
      req,
    });
    throw { status: 401, message: "Invalid credentials" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastLoginIp: req.ip },
  });

  await writeActivityLog({
    userId: user.id,
    action: "LOGIN",
    entity: "USER",
    entityId: user.id,
    req,
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { success: true, token, user: userWithoutPassword };
};

exports.logout = async (req) => {
  await writeActivityLog({
    userId: req.user?.id,
    action: "LOGOUT",
    entity: "USER",
    entityId: req.user?.id,
    req,
  });
};

exports.profile = async (req) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      jobRole: true,
      profileImage: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) throw { status: 404, message: "User not found" };

  await writeActivityLog({
    userId: req.user.id,
    action: "READ",
    entity: "USER",
    entityId: req.user.id,
    req,
  });

  return user;
};

exports.getUsers = async (req) => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      jobRole: true,
      lastLoginAt: true,
      lastLoginIp: true,
      createdAt: true,
      profileImage: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

exports.updateUser = async (req) => {
  const { id } = req.params;
  const { name, role, email, jobRole } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(role && { role }),
      ...(email && { email }),
      ...(jobRole !== undefined && { jobRole }),
    },
  });

  await writeActivityLog({
    userId: req.user?.id,
    action: "UPDATE",
    entity: "USER",
    entityId: id,
    metadata: { changes: req.body },
    req,
  });

  return user;
};

exports.deleteUser = async (req) => {
  const { id } = req.params;
  const user = await prisma.user.delete({ where: { id } });

  await writeActivityLog({
    userId: req.user?.id,
    action: "DELETE",
    entity: "USER",
    entityId: id,
    description: `Deleted user: ${user.email}`,
    req,
  });
};

exports.changePassword = async (req) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw { status: 400, message: "Current and new password required" };
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    throw { status: 401, message: "Current password is incorrect" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  await writeActivityLog({
    userId: req.user.id,
    action: "UPDATE",
    entity: "USER",
    entityId: req.user.id,
    description: "Changed password",
    req,
  });
};
