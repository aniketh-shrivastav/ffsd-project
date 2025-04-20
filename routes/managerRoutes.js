const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const User = require("../models/User"); // Import User model
const SellerProfile = require("../models/sellerProfile");
const ServiceBooking = require("../models/serviceBooking");

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
router.get("/dashboard", isAuthenticated, isManager, async (req, res) => {
  try {
    // Fetch total number of active users (excluding suspended users)
    const totalUsers = await User.countDocuments({ suspended: { $ne: true } });

    // Fetch count by role, excluding suspended users
    const userCounts = await User.aggregate([
      { $match: { suspended: { $ne: true } } }, // Exclude suspended users
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    // Convert userCounts to an object like { customer: 650, seller: 230, etc. }
    const userDistribution = userCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Ensure all roles are accounted for (default to 0 if missing)
    const roles = ["customer", "service-provider", "seller", "admin"];
    const formattedCounts = roles.map(role => userDistribution[role] || 0);

    res.render("manager/dashboard", {
      totalUsers,
      userCounts: formattedCounts, // Will be used for pie chart
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send("Error loading dashboard data.");
  }
});

router.get('/orders', isAuthenticated, isManager, async (req, res) => {
  try {
    const bookings = await ServiceBooking.find()
      .populate('customerId')
      .populate('providerId')
      .sort({ createdAt: -1 });

    res.render('manager/orders', { bookings });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading bookings');
  }
});

router.get("/payments", isAuthenticated, isManager, (req, res) => {
  const paymentsPath = path.join(__dirname, "../data/payments.json"); // Adjust path as needed

  fs.readFile(paymentsPath, "utf8", (err, data) => {
    if (err) {
      console.error("Failed to load payments data:", err);
      return res.status(500).send("Error loading payments.");
    }

    const payments = JSON.parse(data);
    res.render("manager/payments", { payments });
  });
});

router.get("/services", isAuthenticated, isManager, async (req, res) => {
  try {
      // Fetch active service providers (not suspended)
      const serviceProviders = await User.find({
          role: "service-provider",
          suspended: { $ne: true }
      });
     

      // Filter out sellers where the associated User was suspended
      const sellers = await SellerProfile.find().populate("sellerId", "name email phone suspended");

      const activeSellers = sellers.filter(seller => seller.sellerId && !seller.sellerId.suspended);


      // Render the page with data
      res.render("manager/services", { serviceProviders, sellers: activeSellers });

  } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching data");
  }
});

router.get("/users", isAuthenticated, isManager, async (req, res) => {
  try {
    const users = await User.find({}, "name email role suspended"); // Fetch users from MongoDB

    // Format the user data
    const formattedDB = users.map(user => ({
      ...user.toObject(), // Convert Mongoose document to plain object
      status: user.suspended ? "Suspended" : "Active",
      joined: "2024-01-15",
    }));

    // Render the view with MongoDB users only
    res.render("manager/users", { users: formattedDB });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Database error");
  }
});

router.post("/users/suspend/:id", async (req, res) => {
  try {
    const userId = req.params.id; // This should match _id in MongoDB
    console.log("Suspending user with ID:", userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Instead of deleting, update the "suspended" field
    user.suspended = true; // Ensure you have this field in your schema
    await user.save();

    res.json({ success: true, message: "User suspended successfully" });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post('/cancel-booking/:id', isAuthenticated, isManager, async (req, res) => {
  try {
    await ServiceBooking.findByIdAndUpdate(req.params.id, {
      status: 'rejected-by-admin'
    });
    res.redirect('/manager/orders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error cancelling booking');
  }
});

module.exports = router;
