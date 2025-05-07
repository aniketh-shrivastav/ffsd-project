const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ServiceBooking = require("../models/serviceBooking");

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
// This route handles rendering booking data for the service provider
router.get("/bookingManagement", serviceOnly, async (req, res) => {
  try {
    const providerId = req.session.user.id;

    const bookings = await ServiceBooking.find({ providerId })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Only calculate totalCost if it's missing
    const provider = await User.findById(providerId).lean();
    const serviceMap = {};
    provider.servicesOffered.forEach(service => {
      serviceMap[service.name] = service.cost;
    });

    bookings.forEach(order => {
      if (!order.totalCost || order.totalCost === 0) {
        let total = 0;
        order.selectedServices.forEach(serviceName => {
          total += serviceMap[serviceName] || 0;
        });
        order.totalCost = total;
      }
    });

    res.render("service/bookingManagement", { bookings });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading bookings.");
  }
});

router.post('/updateBookingStatus', serviceOnly, async (req, res) => {
  const { orderId, newStatus } = req.body;

  try {
    const booking = await ServiceBooking.findById(orderId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = newStatus;
    await booking.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/updateMultipleBookingStatus', serviceOnly, async (req, res) => {
  const { orderIds, newStatus } = req.body;

  try {
    await ServiceBooking.updateMany(
      { _id: { $in: orderIds } },
      { $set: { status: newStatus } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// Earnings
router.get("/earnings", serviceOnly, async (req, res) => {
  try {
    const providerId = req.session.user.id;

    // Get all bookings for this provider with status "Ready"
    const completedBookings = await ServiceBooking.find({
      providerId: providerId,
      status: "Ready",
      totalCost: { $exists: true }
    });

    const totalEarnings = completedBookings.reduce((sum, booking) => sum + booking.totalCost, 0);

    // Assuming all Ready bookings are considered for payout
    const pendingPayouts = totalEarnings; // You can change this if there's a status or flag to indicate if it's paid or not

    // Available balance is 80% after 20% commission deduction
    const availableBalance = Math.round(pendingPayouts * 0.8);

    const transactions = completedBookings.map(booking => ({
      date: booking.date.toLocaleDateString(),
      amount: Math.round(booking.totalCost * 0.8),
      status: "Ready" // You can expand this logic later
    }));

    const payoutData = {
      totalEarnings,
      pendingPayouts,
      availableBalance,
      transactions
    };

    res.render("service/earnings", { payoutData });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Customer Communication
router.get("/customerCommunication", serviceOnly, (req, res) => {
  res.render("service/customerCommunication");
});
router.get("/reviews", serviceOnly, async (req, res) => {
  try {
    // Get reviews for the currently logged-in service provider
    const reviews = await ServiceBooking.find({
      providerId: req.session.user.id,
      rating: { $exists: true },
      review: { $exists: true }
    })
    .populate("customerId", "name profileImage") // populate name and optional image
    .sort({ createdAt: -1 }); // optional: show latest first

    res.render("service/reviews", { reviews });
  } catch (error) {
    console.error("Failed to load reviews:", error);
    res.status(500).send("Error loading reviews");
  }
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

router.put('/updateBooking', serviceOnly, async (req, res) => {
  const { orderId, status, totalCost } = req.body;

  try {
    const booking = await ServiceBooking.findById(orderId);
    if (!booking) return res.status(404).send('Booking not found');

    if (status) booking.status = status;
    if (typeof totalCost !== 'undefined') booking.totalCost = Number(totalCost);

    await booking.save();
    res.status(200).send('Booking updated successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating booking');
  }
});

// Add this in your service routes
router.post('/updateCost/:id', serviceOnly, async (req, res) => {
  const { id } = req.params;
  const { totalCost } = req.body;

  try {
    const booking = await ServiceBooking.findById(id);
    if (!booking) return res.status(404).send('Booking not found');

    booking.totalCost = Number(totalCost);
    await booking.save();

    res.redirect('/service/bookingManagement');
  } catch (error) {
    console.error("Cost update failed:", error);
    res.status(500).send('Failed to update cost');
  }
});


module.exports = router;
