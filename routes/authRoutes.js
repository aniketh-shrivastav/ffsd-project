const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");

// Session timeout configuration (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// ─────────────────────────────────────────────
// GET Signup
// ─────────────────────────────────────────────
router.get("/signup", (req, res) => {
  if (req.session.user) {
    return redirectBasedOnRole(req.session.user.role, res);
  }
  res.render("signup", { 
    error: null,
    formData: {},
    roles: ["customer", "seller", "service-provider", "manager"]
  });
});

// ─────────────────────────────────────────────
// POST Signup
// ─────────────────────────────────────────────
router.post("/signup", [
  // Validation middleware
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }),
  body("phone").isMobilePhone(),
  body("role").isIn(["customer", "seller", "service-provider", "manager"])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render("signup", {
      error: errors.array()[0].msg,
      formData: req.body,
      roles: ["customer", "seller", "service-provider", "manager"]
    });
  }

  const { name, email, password, role, businessName, workshopName, phone } = req.body;
  const finalName = name || businessName || workshopName;

  try {
    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render("signup", {
        error: "Email already exists",
        formData: req.body,
        roles: ["customer", "seller", "service-provider", "manager"]
      });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      name: finalName,
      email,
      phone,
      password: hashedPassword,
      role,
      ...(businessName && { businessName }),
      ...(workshopName && { workshopName })
    });

    await newUser.save();

    // Auto-login after signup
    req.session.user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role
    };
    req.session.cookie.expires = new Date(Date.now() + SESSION_TIMEOUT);
    req.session.save();

    return redirectBasedOnRole(newUser.role, res);

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).render("signup", {
      error: "Server error. Please try again.",
      formData: req.body,
      roles: ["customer", "seller", "service-provider", "manager"]
    });
  }
});

// ─────────────────────────────────────────────
// GET Login
// ─────────────────────────────────────────────
router.get("/login", (req, res) => {
  if (req.session.user) {
    return redirectBasedOnRole(req.session.user.role, res);
  }
  res.render("login", { error: null });
});

// ─────────────────────────────────────────────
// POST Login
// ─────────────────────────────────────────────
router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render("login", { 
      error: "Invalid credentials",
      email: req.body.email
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).render("login", {
        error: "Invalid credentials",
        email: req.body.email
      });
    }

    if (user.suspended) {
      return res.status(403).render("login", {
        error: "Account suspended. Contact support.",
        email: req.body.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render("login", {
        error: "Invalid credentials",
        email: req.body.email
      });
    }

    // Successful login
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };
    req.session.cookie.expires = new Date(Date.now() + SESSION_TIMEOUT);
    req.session.save();

    return redirectBasedOnRole(user.role, res);

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).render("login", {
      error: "Server error. Please try again.",
      email: req.body.email
    });
  }
});

// ─────────────────────────────────────────────
// Static Page Routes
// ─────────────────────────────────────────────
router.get("/", (req, res) => {
  res.render("all/index", { 
    user: req.session?.user,
    isAuthenticated: !!req.session.user
  });
});

router.get("/contactus", (req, res) => {
  res.render("all/contactus", { 
    user: req.session?.user,
    isAuthenticated: !!req.session.user
  });
});

router.get("/feedback", (req, res) => {
  res.render("all/feedback", { 
    user: req.session?.user,
    isAuthenticated: !!req.session.user
  });
});

router.get("/faq", (req, res) => {
  res.render("all/faq", { 
    user: req.session?.user,
    isAuthenticated: !!req.session.user
  });
});

// ─────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Logout failed");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

// Helper function for role-based redirection
function redirectBasedOnRole(role, res) {
  const routes = {
    "manager": "/manager/dashboard",
    "customer": "/customer/index",
    "seller": "/seller/dashboard",
    "service-provider": "/service/dashboardService"
  };

  if (!routes[role]) {
    return res.status(403).render("error", { 
      message: "Unauthorized role access",
      status: 403
    });
  }

  return res.redirect(routes[role]);
}

module.exports = router;