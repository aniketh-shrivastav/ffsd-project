const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// ─────────────────────────────────────────────
// SQLite Setup
// ─────────────────────────────────────────────
const db = new sqlite3.Database(":memory:");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);
});

const dataDir = path.join(__dirname, "../data");
const usersFile = path.join(dataDir, "users.json");



// Load users from JSON
const loadUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
  } catch {
    return [];
  }
};

// ─────────────────────────────────────────────
// GET Signup
// ─────────────────────────────────────────────
router.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

// ─────────────────────────────────────────────
// POST Signup
// ─────────────────────────────────────────────
router.post("/signup", (req, res) => {
  const { name, email, password, role, businessName, workshopName } = req.body;
  const persistedUsers = loadUsers();
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
  } else if ([...persistedUsers].some(u => u.email === email)) {
    error = "Email already exists";
  }

  if (error) {
    if (req.headers.accept.includes('application/json')) {
      return res.status(400).json({ success: false, message: error });
    } else {
      return res.render("signup", { error });
    }
  }

  const newUser = {
    id: Date.now(),
    name: finalName,
    email,
    password,
    role
  };

  

  db.run(`
    INSERT INTO users (id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `, [newUser.id, newUser.name, newUser.email, newUser.password, newUser.role], (err) => {
    if (err) {
      console.error("SQLite insert error:", err.message);
    } else {
      console.log("✅ SQLite user inserted:", newUser);
    }
  });

  if (req.headers.accept.includes('application/json')) {
    return res.json({ success: true, message: "Signup successful. Redirecting to login..." });
  } else {
    return res.redirect("/login");
  }
});

// ─────────────────────────────────────────────
// GET Login
// ─────────────────────────────────────────────
router.get("/login", (req, res) => {
  res.render("login");
});

// ─────────────────────────────────────────────
// POST Login
// ─────────────────────────────────────────────
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const persistedUsers = loadUsers();

  db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, sqliteUser) => {
    if (err) {
      console.error("SQLite error:", err);
      return res.status(500).send("Internal error");
    }

    
    const jsonUser = persistedUsers.find(u => u.email === email && u.password === password);

    const user = sqliteUser || jsonUser;

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.user = { id: user.id, name: user.name, role: user.role };

    if (user.role === "manager") res.redirect("/manager/dashboard");
    else if (user.role === "customer") res.redirect("/customer/index");
    else if (user.role === "seller") res.redirect("/Seller/dashboard");
    else if (user.role === "service-provider") res.redirect("/service/dashboardService");
    else res.status(403).send("Unknown role");
  });
});

// ─────────────────────────────────────────────
// Static Page Routes
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
