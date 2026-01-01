const express = require("express");
const router = express.Router();

const { authMiddleware, roleMiddleware } = require("../../middleware/auth");
const authController = require("../controllers/auth.controller");

// REGISTER
router.post(
  "/register",
  authMiddleware,
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  authController.register
);

// LOGIN
router.post("/login", authController.login);

// LOGOUT
router.post("/logout", authMiddleware, authController.logout);

// PROFILE
router.get("/profile", authMiddleware, authController.profile);

// USERS
router.get(
  "/users",
  authMiddleware,
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  authController.getUsers
);

router.put(
  "/users/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  authController.updateUser
);

router.delete(
  "/users/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "SUPERADMIN"]),
  authController.deleteUser
);

// CHANGE PASSWORD
router.post(
  "/change-password",
  authMiddleware,
  authController.changePassword
);

module.exports = router;
