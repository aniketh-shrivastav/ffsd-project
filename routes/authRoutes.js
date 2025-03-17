const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create in-memory SQLite DB
const db = new sqlite3.Database(":memory:");

// Create users table
db.serialize(() => {
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);
});

// GET Signup
router.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

// POST Signup
router.post("/signup", (req, res) => {
  const { name, email, password, role, businessName, workshopName } = req.body;
  const finalName = name || businessName || workshopName;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[A-Za-z\s.-]+$/;

  let error = null;
  if (!finalName || !email || !password || !role) {
    error = "All fields are required";
  } else if (!emailRegex.test(email) || !email.endsWith(".com")) {
    error = "Please enter a valid email ending in .com";
  } else if (!nameRegex.test(finalName)) {
    error = "Name should not contain numbers or special characters";
  }

  if (error) {
    if (req.headers.accept.includes("application/json")) {
      return res.status(400).json({ success: false, message: error });
    } else {
      return res.render("signup", { error });
    }
  }

  const query = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
  db.run(query, [finalName, email, password, role], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
      return res.status(500).json({ success: false, message: "Error creating user" });
    }

    console.log("✅ New user added to SQLite:", { id: this.lastID, name: finalName, email, role });

    if (req.headers.accept.includes("application/json")) {
      return res.json({ success: true, message: "Signup successful. Redirecting to login..." });
    } else {
      return res.redirect("/login");
    }
  });
});

// GET Login
router.get("/login", (req, res) => {
  res.render("login");
});

// POST Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, user) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    req.session.user = { id: user.id, name: user.name, role: user.role };

    if (user.role === "manager") res.redirect("/manager/dashboard");
    else if (user.role === "customer") res.redirect("/customer/index");
    else if (user.role === "seller") res.redirect("/seller/index");
    else if (user.role === "service-provider") res.redirect("/service/dashboardService");
    else res.status(403).send("Unknown role");
  });
});

// Home
router.get("/", (req, res) => {
  res.render("all/index", { user: req.session.user });
});

router.get("/contactus", (req, res) => {
  res.render("all/contactus", { user: req.session.user });
});
router.get("/feedback", (req, res) => {
  res.render("all/feedback", { user: req.session.user });
});
router.get("/faq", (req, res) => {
  res.render("all/faq", { user: req.session.user });
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;