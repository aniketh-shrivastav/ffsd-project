const express = require("express");
const User = require("../models/User");
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

router.post("/profile/update", serviceOnly, async (req, res) => {
  try {
      console.log("Request body received:", req.body); // Debugging

      const { name, phone, servicesOffered = [] } = req.body;
      const userId = req.session.user?.id;

      if (!userId) {
          return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // Ensure servicesOffered is an array
      const servicesArray = typeof servicesOffered === "string"
          ? servicesOffered.split(",").map(s => s.trim()).filter(Boolean)
          : Array.isArray(servicesOffered) ? servicesOffered : [];

      console.log("Processed servicesOffered:", servicesArray); // Debugging

      await User.findByIdAndUpdate(userId, { name, phone, servicesOffered: servicesArray });

      res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ success: false, message: "Error updating profile" });
  }
});

module.exports = router;
