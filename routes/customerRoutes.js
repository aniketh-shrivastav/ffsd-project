const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Cart = require("../models/Cart");
const { getAllProducts, getProductById } = require("../utils/productUtils");

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
  const products = getAllProducts();
  res.render("customer/index", { products, user: req.session.user });
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

      const product = getProductById(parseInt(id));
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
