const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Helper to load users
const usersFile = path.join(__dirname, "../data/users.json");
const loadUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
  } catch {
    return [];
  }
};

// Helper to save users
const saveUsers = (users) => {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error saving users:", error);
    return false;
  }
};

// Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect("/login");
};

const isManager = (req, res, next) => {
  if (req.session.user?.role === "manager") return next();
  res.status(403).send("Access Denied: Managers Only");
};

// Routes
router.get("/dashboard", isAuthenticated, isManager, (req, res) => {
  res.render("manager/dashboard");
});

router.get("/orders", isAuthenticated, isManager, (req, res) => {
  res.render("manager/orders");
});

router.get("/payments", isAuthenticated, isManager, (req, res) => {
  const paymentsPath = path.join(__dirname, '../data/payments.json'); // adjust path as needed

  fs.readFile(paymentsPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Failed to load payments data:", err);
      return res.status(500).send("Error loading payments.");
    }

    const payments = JSON.parse(data);
    res.render("manager/payments", { payments });
  });
});



router.get("/services", isAuthenticated, isManager, (req, res) => {
  res.render("manager/services");
});

router.get("/users", isAuthenticated, isManager, (req, res) => {
  res.render("manager/users", { users: loadUsers() });
});

// NEW ENDPOINT: Suspend user
router.post("/users/suspend/:id", isAuthenticated, isManager, (req, res) => {
  const userId = req.params.id;
  
  // Load current users
  const users = loadUsers();
  
  // Find the user with the given ID
  const userIndex = users.findIndex(user => user.id.toString() === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  
  // Remove the user
  users.splice(userIndex, 1);
  
  // Save the updated users
  if (saveUsers(users)) {
    res.json({ success: true, message: "User suspended successfully" });
  } else {
    res.status(500).json({ success: false, message: "Failed to update users data" });
  }
});

module.exports = router;