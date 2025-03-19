const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const db = require("../db");
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
  const jsonUsers = loadUsers(); // still load from users.json

  // Get users from database
  db.all("SELECT id, name, role FROM users", [], (err, dbUsers) => {
    if (err) {
      console.error("Failed to fetch users from DB:", err);
      return res.status(500).send("Database error");
    }

    // Mark where each user came from (optional)
    const formattedJSON = jsonUsers.map(user => ({
      ...user,
      status: "Active",
      joined: "2024-01-15"
    }));

    const formattedDB = dbUsers.map(user => ({
      ...user,
      status: "Active",
      joined: "2024-01-15"
    }));

    const combinedUsers = [...formattedJSON, ...formattedDB];

    // Render the view with both
    res.render("manager/users", { users: combinedUsers });
  });
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