// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const ServiceBooking = require("../models/serviceBooking");
const User = require("../models/User");

router.post("/create-booking", async (req, res) => {
  try {
    const {
      providerId,
      selectedServices,
      date,
      phone,
      name,
      carModel,
      address,
      description,
      district
    } = req.body;

    // Assume customer is authenticated and their ID is available via middleware/session
    const customerId = req.session.user.id;

    const booking = new ServiceBooking({
      customerId,
      providerId,
      selectedServices,
      date,
      phone,
      name,
      carModel,
      address,
      description,
      district
    });

    await booking.save();
    res.status(200).json({ message: "Booking created successfully", booking });
  } catch (error) {
    console.error("Booking creation failed:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

module.exports = router;
