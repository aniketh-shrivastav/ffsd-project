const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
const usersFile = path.join(dataDir, "users.json");

let memoryUsers = []; // In-memory store for new users (removed on restart)

// Load persistent users from JSON file
const loadUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
  } catch {
    return [];
  }
};

// GET Signup
router.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

// POST Signup
router.post("/signup", (req, res) => {
  const persistedUsers = loadUsers();
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
  } else if ([...persistedUsers, ...memoryUsers].some(u => u.email === email)) {
    error = "Email already exists";
  }

  if (error) {
    // Respond with error for fetch/JS client
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

  memoryUsers.push(newUser);
  console.log("✅ New in-memory user:", newUser);

  // Successful signup response
  if (req.headers.accept.includes('application/json')) {
    return res.json({ success: true, message: "Signup successful. Redirecting to login..." });
  } else {
    return res.redirect("/login");
  }
});

// GET Login
router.get("/login", (req, res) => {
  res.render("login");
});

// POST Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const persistedUsers = loadUsers();

  // Merge both sources
  const allUsers = [...persistedUsers, ...memoryUsers];
  const user = allUsers.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  req.session.user = { id: user.id, name: user.name, role: user.role };

  if (user.role === "manager") res.redirect("/manager/dashboard");
  else if (user.role === "customer") res.redirect("/customer/index");
  else if (user.role === "seller") res.redirect("/seller/index");
  else if (user.role === "service-provider") res.redirect("/service/dashboardService");
  else res.status(403).send("Unknown role");
});

// Home route
router.get("/", (req, res) => {
  res.render("all/index", { user: req.session.user });
});

router.get("/contactus", (req, res) =>{
  res.render("all/contactus", {user: req.session.user});
});
router.get("/feedback", (req, res) =>{
  res.render("all/feedback", {user: req.session.user});
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
