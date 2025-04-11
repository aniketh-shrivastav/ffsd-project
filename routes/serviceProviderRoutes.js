const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect("/login");
};

const isService = (req, res, next) => {
  if (req.session.user?.role === "service-provider") return next();
  res.status(403).send("Access Denied: Service Providers Only");
};

// Combined middleware
const serviceOnly = [isAuthenticated, isService];

// Routes

// Dashboard
router.get("/dashboardService", serviceOnly, (req, res) => {
  res.render("service/dashboardService");
});

// Profile Settings
router.get("/profileSettings", serviceOnly, async (req, res) => {
  try {
    // Ensure session user is available
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).send("Unauthorized: Please log in again");
    }

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Ensure missing fields are initialized to avoid errors
    user.phone = user.phone || "";
    user.servicesOffered = user.servicesOffered || [];

    res.render("service/profileSettings", { user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// Booking Management
router.get("/bookingManagement", serviceOnly, (req, res) => {
  res.render("service/bookingManagement");
});

// Earnings
router.get("/earnings", serviceOnly, (req, res) => {
  res.render("service/earnings");
});

// Customer Communication
router.get("/customerCommunication", serviceOnly, (req, res) => {
  res.render("service/customerCommunication");
});
router.get("/reviews", serviceOnly, (req, res) => {
  res.render("service/reviews");
});

// DELETE /service/profile/delete/:id
router.delete("/profile/delete/:id", async (req, res) => {
  try {
      const result = await User.findByIdAndDelete(req.params.id);
      if (!result) return res.status(404).json({ success: false, message: "User not found" });
      res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
