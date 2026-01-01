const authService = require("../services/auth.service");

exports.register = async (req, res) => {
  try {
    const result = await authService.register(req);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await authService.login(req);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await authService.logout(req);
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.profile = async (req, res) => {
  try {
    const user = await authService.profile(req);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await authService.getUsers(req);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await authService.updateUser(req);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await authService.deleteUser(req);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    await authService.changePassword(req);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
