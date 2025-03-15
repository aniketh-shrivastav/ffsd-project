const express = require("express");
const router = express.Router();

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
router.get("/profileSettings", serviceOnly, (req, res) => {
  res.render("service/profileSettings");
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

module.exports = router;
