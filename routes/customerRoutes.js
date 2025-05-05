const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Cart = require("../models/Cart");
const Product = require("../models/Product"); // ✅ Import Product model

const CustomerProfile = require('../models/CustomerProfile');
const mongoose = require("mongoose");
const ServiceBooking = require("../models/serviceBooking");

// Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect("/login");
};

const isCustomer = (req, res, next) => {
  if (req.session.user?.role === "customer") return next();
  res.status(403).send("Access Denied: Customers Only");
};

// Combined middleware for simplicity
const customerOnly = [isAuthenticated, isCustomer];



// Routes


// GET /customer/index
router.get("/index", customerOnly, async (req, res) => {
  try {
    const products = await Product.find({ status: "approved" }); // ✅ only show approved products
    res.render("customer/index", {
      products,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.render("customer/index", {
      products: [],
      user: req.session.user,
      error: "Failed to load products"
    });
  }
});


router.get("/booking", customerOnly, async (req, res) => {
  try {
    const customerId = req.session.user.id;

    const customerProfile = await CustomerProfile.findOne({ userId: customerId });

    const serviceProvidersData = await User.find(
      { role: "service-provider", suspended: { $ne: true } },
      "name servicesOffered district cost"
    );

    const uniqueServices = new Set();
    const uniqueDistricts = new Set();
    const serviceProviders = [];
    const serviceCostMap = {}; // ✅ Create service cost map

    serviceProvidersData.forEach(provider => {
      if (provider.servicesOffered && provider.servicesOffered.length > 0) {
        provider.servicesOffered.forEach(service => {
          if (service.name) {
            uniqueServices.add(service.name);
            if (!serviceCostMap[service.name]) {
              serviceCostMap[service.name] = service.cost;
            }
          }
        });
        if (provider.district) uniqueDistricts.add(provider.district);
        serviceProviders.push(provider);
      }
    });

    res.render("customer/booking", {
      uniqueServices: Array.from(uniqueServices),
      uniqueDistricts: Array.from(uniqueDistricts),
      serviceProviders,
      customerProfile,
      selectedServiceType: "",
      selectedDistrict: "",
      serviceCostMap: JSON.stringify(serviceCostMap) // ✅ Add this
    });
  } catch (error) {
    console.error("Error rendering booking page:", error);
    res.status(500).send("Error loading booking page");
  }
});


router.get("/cart", customerOnly, async (req, res) => {
  try {
      const cart = await Cart.findOne({ userId: req.session.user.id });
      res.render("customer/cart", {
          user: req.session.user,
          items: cart?.items || []
      });
  } catch (err) {
      console.error("Cart fetch error:", err.message);
      res.render("customer/cart", {
          user: req.session.user,
          items: [],
          error: "Failed to load cart"
      });
  }
});

router.post("/cart/add", customerOnly, async (req, res) => {
  try {
      const userId = req.session.user.id;
      const { id } = req.body;

      const product = await Product.findById(id);

      console.log("Incoming cart item:", { id, product }); // ✅ Debugging line added here

      if (!product) {
          return res.status(404).json({ success: false, message: "Product not found" });
      }

      const { name, price, image } = product;

      let cart = await Cart.findOne({ userId });

      if (!cart) {
          cart = new Cart({ userId, items: [] });
      }

      const existingItem = cart.items.find(item => item.productId === id.toString());

      if (existingItem) {
          existingItem.quantity += 1;
      } else {
        cart.items.push({
          productId: id.toString(), // <-- Important!
          name,
          price,
          image,
          quantity: 1
        });
      }

      await cart.save();
      console.log("Cart after add:", cart.items);
      res.json({ success: true });
  } catch (error) {
      console.error("Cart add error:", error.message);
      res.status(500).json({ success: false, message: "Error adding to cart" });
  }
});


router.get('/history', customerOnly, async (req, res) => {
  const customerId = req.session.user.id;

  try {
    const bookings = await ServiceBooking.find({ customerId })
      .populate('providerId') // providerId should bring in servicesOffered
      .sort({ createdAt: -1 });

    const enrichedBookings = bookings.map(booking => {
      const provider = booking.providerId;
      const servicesOffered = provider?.servicesOffered || [];

      // Build a cost map from the provider's current service prices
      const costMap = {};
      servicesOffered.forEach(s => {
        costMap[s.name] = s.cost;
      });

      // ✅ Use saved cost if it exists and is valid
      let totalCost = booking.totalCost;
      if (!totalCost || totalCost === 0) {
        totalCost = (booking.selectedServices || []).reduce((sum, service) => {
          return sum + (costMap[service] || 0); // fallback if service not found
        }, 0);
      }

      return {
        ...booking.toObject(),
        totalCost
      };
    });

    res.render('customer/history', { bookings: enrichedBookings });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get("/payment", customerOnly, (req, res) => {
  res.render("customer/payment");
});

router.get('/profile',customerOnly, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Fetch basic signup details
    const user = await User.findById(userId);

    // Check for extended profile
    let profile = await CustomerProfile.findOne({ userId });

    // If profile doesn't exist yet, create an empty placeholder (optional)
    if (!profile) {
      profile = {
        name: user.name,
        email: user.email, // Optional
        phone: user.phone,
        address: '',
        district: '',
        carModel: '',
        payments: ''
      };
    }

    res.render('customer/profile', { user, profile });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error loading profile");
  }
});

router.post('/profile', async (req, res) => {
  try {
    const userId = req.session.user.id; // ✅ define userId first

    const {name, phone, address, district, carModel, payments } = req.body;
    await User.findByIdAndUpdate(userId, { name, phone }, { new: true });
    // ✅ Upsert (insert if not found, update if exists)
    await CustomerProfile.findOneAndUpdate(
      { userId },
      { address, district, carModel, payments },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.redirect('/customer/profile');
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Error updating profile");
  }
});
router.get("/product/:id", customerOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("seller", "name");
    if (!product || product.status !== "approved") {
      return res.status(404).send("Product not found");
    }
    res.render("customer/productDetails", { product, user: req.session.user });
  } catch (error) {
    console.error("Product detail fetch error:", error);
    res.status(500).send("Error fetching product details");
  }
});

router.post('/rate-service/:id',customerOnly, async (req, res) => {
  const { rating, review } = req.body;
  const bookingId = req.params.id;

  try {
    await ServiceBooking.findByIdAndUpdate(bookingId, {
      rating: Number(rating),
      review: review || ''
    });

    res.status(200).json({ success: true, message: 'Thank you for rating the service!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Something went wrong while submitting the rating.' });
  }
});

router.get("/purchase", customerOnly, (req, res) => {
  res.render("customer/purchase");
});

router.get("/reviews", customerOnly, (req, res) => {
  res.render("customer/reviews");
});

router.get("/search", customerOnly, (req, res) => {
  res.render("customer/search");
});

router.get("/service", customerOnly, (req, res) => {
  res.render("customer/service");
});

module.exports = router;
