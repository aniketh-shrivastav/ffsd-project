const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const User = require("../models/User");

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

// Load products with error handling
let productsData = { products: [] };
try {
  const fileContent = fs.readFileSync(path.join(__dirname, '../data/product.json'), 'utf8');
  productsData = JSON.parse(fileContent);
} catch (err) {
  console.error("Failed to load product.json:", err);
}

// Routes
router.get("/index", customerOnly, (req, res) => {
  res.render("customer/index", { products: productsData.products, user: req.session.user });
});

router.get("/booking", customerOnly, async (req, res) => {
  try {
    const serviceProvidersData = await User.find(
      { role: "service-provider", suspended: { $ne: true } },
      "name servicesOffered"
    );

    // Extract unique services and map providers
    const serviceProviders = {};
    const uniqueServices = new Set();

    serviceProvidersData.forEach(provider => {
      if (provider.servicesOffered && provider.servicesOffered.length > 0) {
        provider.servicesOffered.forEach(service => {
          uniqueServices.add(service);
          if (!serviceProviders[service]) {
            serviceProviders[service] = [];
          }
          serviceProviders[service].push(provider.name);
        });
      }
    });

    res.render("customer/booking", {
      uniqueServices: Array.from(uniqueServices),
      serviceProviders
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).send("Error fetching services");
  }
});

module.exports = router;

router.get("/cart", customerOnly, (req, res) => {
  res.render("customer/cart");
});

router.get("/history", customerOnly, (req, res) => {
  res.render("customer/history");
});

router.get("/payment", customerOnly, (req, res) => {
  res.render("customer/payment");
});

router.get("/profile", customerOnly, (req, res) => {
  res.render("customer/profile");
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
