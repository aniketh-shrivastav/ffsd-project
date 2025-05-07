const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const User = require("../models/User"); // Import User model
const SellerProfile = require("../models/sellerProfile");
const ServiceBooking = require("../models/serviceBooking");
const CustomerProfile = require("../models/CustomerProfile");
const Product = require("../models/Product");
const managerController = require('../controllers/managerController');
const Order = require("../models/Orders");
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
    const totalUsers = await User.countDocuments({ suspended: { $ne: true } });

    const userCounts = await User.aggregate([
      { $match: { suspended: { $ne: true } } },
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const userDistribution = userCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const roles = ["customer", "service-provider", "seller", "admin"];
    const formattedCounts = roles.map(role => userDistribution[role] || 0);

    // ✅ Fetch products by status
    const [pendingProducts, approvedProducts, rejectedProducts] = await Promise.all([
      Product.find({ status: "pending" }).populate("seller"),
      Product.find({ status: "approved" }).populate("seller"),
      Product.find({ status: "rejected" }).populate("seller")
    ]);

    // ✅ Sum orders where status is "pending"
    const orderEarningsResult = await Order.aggregate([
      { $match: { orderStatus: "pending" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const orderEarnings = orderEarningsResult[0]?.total || 0;

    // ✅ Sum services where status is "Ready"
    const serviceEarningsResult = await ServiceBooking.aggregate([
      { $match: { status: "Ready" } },
      { $group: { _id: null, total: { $sum: "$totalCost" } } }
    ]);
    const serviceEarnings = serviceEarningsResult[0]?.total || 0;

    const totalEarnings = orderEarnings + serviceEarnings;
    const commission = totalEarnings * 0.20;

    res.render("manager/dashboard", {
      totalUsers,
      userCounts: formattedCounts,
      pendingProducts,
      approvedProducts,
      rejectedProducts,
      totalEarnings,
      commission
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Error loading dashboard data.");
  }
});

router.get('/orders', isAuthenticated, isManager, async (req, res) => {
  try {
    // Fetch Bookings
    const bookings = (await ServiceBooking.find()
    .populate('customerId')
    .populate('providerId')
    .sort({ createdAt: -1 })
  ).filter(b => b.customerId && !b.customerId.suspended && b.providerId && !b.providerId.suspended);
  
  const orders = (await Order.find()
    .populate('userId')
    .populate('items.seller')
    .sort({ placedAt: -1 })
  ).filter(o =>
    o.userId && !o.userId.suspended &&
    o.items.every(item => item.seller && !item.seller.suspended)
  );

    res.render('manager/orders', { bookings, orders });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading bookings and orders');
  }
});

router.get("/payments",isAuthenticated,isManager, managerController.getPayments);

router.get("/services", isAuthenticated, isManager, async (req, res) => {
  try {
    // Fetch active service providers
    const serviceProviders = await User.find({
      role: "service-provider",
      suspended: { $ne: true },
    });

    // Active sellers (with valid associated User)
    const sellers = await SellerProfile.find().populate("sellerId", "name email phone suspended");
    const activeSellers = sellers.filter(seller => seller.sellerId && !seller.sellerId.suspended);

    // Fetch customers and populate user info
    const customers = await CustomerProfile.find().populate("userId", "name email phone suspended");

    const activeCustomers = customers.filter(c => c.userId && !c.userId.suspended);

    // Render view
    res.render("manager/services", {
      serviceProviders,
      sellers: activeSellers,
      customers: activeCustomers, // ✅ pass to view
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data");
  }
});

router.get('/profile-data/:id', managerController.getProfileData);

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

router.post("/users/suspend/:id",isAuthenticated, isManager, async (req, res) => {
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


router.post("/users/restore/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    console.log("Restoring user with ID:", userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.suspended = false; // Re-activate the user
    await user.save();

    res.json({ success: true, message: "User restored successfully" });
  } catch (error) {
    console.error("Error restoring user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post('/cancel-booking/:id', isAuthenticated, isManager, async (req, res) => {
  try {
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    // Save current status before rejecting
    booking.previousStatus = booking.status;
    booking.status = 'Rejected'; // Use the enum status "Rejected" as per your schema
    await booking.save();

    res.redirect('/manager/orders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error cancelling booking');
  }
});

router.post('/restore-booking/:id', isAuthenticated, isManager, async (req, res) => {
  try {
    const booking = await ServiceBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    // Restore to previous status if exists, otherwise default to "Open"
    booking.status = booking.previousStatus || "Open";
    booking.previousStatus = undefined; // Clear previousStatus
    await booking.save();

    res.redirect('/manager/orders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error restoring booking');
  }
});


router.post("/products/:id/approve", isAuthenticated, isManager, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { status: "approved" });
    res.redirect("/manager/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error approving product");
  }
});

router.post("/products/:id/reject", isAuthenticated, isManager, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { status: "rejected" });
    res.redirect("/manager/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error rejecting product");
  }
});

router.post('/cancel-order/:orderId', isAuthenticated, isManager, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).send('Order not found');
    if (order.orderStatus === 'cancelled') return res.status(400).send('Already cancelled');

    // Save current status before cancelling
    order.previousStatus = order.orderStatus;
    order.orderStatus = 'cancelled';
    await order.save();

    res.redirect('/manager/orders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error cancelling order');
  }
});

router.post('/restore-order/:orderId', isAuthenticated, isManager, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).send('Order not found');
    if (order.orderStatus !== 'cancelled') return res.status(400).send('Order is not cancelled');

    // Restore previous status
    order.orderStatus = order.previousStatus || 'pending'; // fallback to pending if missing
    order.previousStatus = undefined; // clear it after restore
    await order.save();

    res.redirect('/manager/orders');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error restoring order');
  }
});

module.exports = router;
