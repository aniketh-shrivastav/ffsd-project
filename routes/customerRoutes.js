const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const orderController = require("../controllers/orderController"); 

const CustomerProfile = require('../models/CustomerProfile');
const mongoose = require("mongoose");
const ServiceBooking = require("../models/serviceBooking");
const Order = require("../models/Orders");

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

    const uniqueServicesSet = new Set();
    const uniqueDistrictsSet = new Set();
    const serviceProviders = [];
    const serviceCostMap = {};

    serviceProvidersData.forEach(provider => {
      if (provider.servicesOffered && provider.servicesOffered.length > 0) {
        provider.servicesOffered.forEach(service => {
          if (service.name) {
            uniqueServicesSet.add(service.name);
            // Save cost only if it's not already stored
            if (!serviceCostMap[service.name]) {
              serviceCostMap[service.name] = service.cost;
            }
          }
        });
        if (provider.district) uniqueDistrictsSet.add(provider.district);
        serviceProviders.push(provider);
      }
    });

    // ✅ Convert Sets to sorted Arrays
    const uniqueServices = Array.from(uniqueServicesSet).sort((a, b) => a.localeCompare(b));
    const uniqueDistricts = Array.from(uniqueDistrictsSet).sort((a, b) => a.localeCompare(b)); // Sorted districts!

    res.render("customer/booking", {
      uniqueServices,
      uniqueDistricts,
      serviceProviders,
      customerProfile,
      selectedServiceType: "",
      selectedDistrict: "",
      serviceCostMap: JSON.stringify(serviceCostMap)
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

router.post("/create-order", customerOnly, orderController.createOrderFromCart);

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
    // 1️⃣ Fetch bookings
    const bookings = await ServiceBooking.find({ customerId })
      .populate('providerId')
      .sort({ createdAt: -1 });

    const enrichedBookings = bookings.map(booking => {
      const provider = booking.providerId;
      const servicesOffered = provider?.servicesOffered || [];

      const costMap = {};
      servicesOffered.forEach(s => {
        costMap[s.name] = s.cost;
      });

      let totalCost = booking.totalCost;
      if (!totalCost || totalCost === 0) {
        totalCost = (booking.selectedServices || []).reduce((sum, service) => {
          return sum + (costMap[service] || 0);
        }, 0);
      }

      return {
        ...booking.toObject(),
        totalCost
      };
    });

    // 2️⃣ Fetch orders for same user
    const orders = await Order.find({ userId: customerId }).sort({ placedAt: -1 });

    // Split orders
    const upcomingOrders = orders.filter(o =>
      ["pending", "confirmed", "shipped"].includes(o.orderStatus)
    );
    const pastOrders = orders.filter(o =>
      ["delivered", "cancelled"].includes(o.orderStatus)
    );

    // 3️⃣ Render everything to EJS
    res.render('customer/history', {
      bookings: enrichedBookings,
      upcomingOrders,
      pastOrders
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/cancel-order/:id', customerOnly, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.session.user.id });
    if (!order || order.orderStatus !== 'pending') {
      return res.status(400).send("Cannot cancel this order.");
    }

    await Order.findByIdAndDelete(order._id);
    res.redirect('/customer/history');
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).send("Server error");
  }
});

// Cancel Service Booking
router.post('/cancel-service/:id', customerOnly, async (req, res) => {
  try {
    const booking = await ServiceBooking.findOne({ _id: req.params.id, customerId: req.session.user.id });
    if (!booking || booking.status !== 'Open') {
      return res.status(400).send("Cannot cancel this service.");
    }

    await ServiceBooking.findByIdAndDelete(booking._id);
    res.redirect('/customer/history');
  } catch (err) {
    console.error("Cancel service error:", err);
    res.status(500).send("Server error");
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

router.delete('/delete-profile', customerOnly, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID missing" });

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
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

router.post('/rate-service/:id', customerOnly, async (req, res) => {
  const { rating, review } = req.body;
  const bookingId = req.params.id;

  try {
    const booking = await ServiceBooking.findById(bookingId);

    // Validate booking exists and belongs to this customer
    if (!booking || booking.customerId.toString() !== req.session.user.id) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Can only rate completed services
    if (booking.status !== 'Ready') {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only rate completed services' 
      });
    }

    // Update rating
    booking.rating = Number(rating);
    booking.review = review || '';
    await booking.save();

    return res.status(200).json({ success: true, message: 'Thank you for your rating!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Something went wrong while submitting the rating.' });
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
