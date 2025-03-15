// SQLite setup (in-memory)
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

// Create table on server start
db.serialize(() => {
  db.run(`CREATE TABLE contactus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL
  )`);
});

// Express routes
const express = require("express");
const router = express.Router();
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect("/login");
};

const isManager = (req, res, next) => {
  if (req.session.user?.role === "manager") return next();
  res.status(403).send("Access Denied: Managers Only");
};
const ManagersOnly = [isAuthenticated, isManager];

// Contact Us submission
router.post("/contactus", (req, res) => {
  const { name, email, subject, message } = req.body;
  const nameRegex = /^[A-Za-z\s.-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!nameRegex.test(name)) return res.status(400).send("Invalid name");
  if (!emailRegex.test(email)) return res.status(400).send("Invalid email");

  const stmt = db.prepare("INSERT INTO contactus (name, email, subject, message) VALUES (?, ?, ?, ?)");
  stmt.run(name, email, subject, message, function (err) {
    if (err) return res.status(500).send("Failed to submit");
    
  });
  stmt.finalize();
  res.redirect('/contactus?submitted=true');
});

// Admin support view
router.get("/manager/support", ManagersOnly, (req, res) => {
  db.all("SELECT * FROM contactus", (err, rows) => {
    if (err) return res.status(500).send("Error loading support data");
    res.render("manager/support", { submissions: rows });
  });
});

// Mark as responded (delete entry)
router.post("/manager/support/respond/:id", ManagersOnly, (req, res) => {
  db.run("DELETE FROM contactus WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).send("Failed to delete ticket");
    res.redirect("/manager/support");
  });
});



module.exports = { router, db };