const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const SellerProfile = require("../models/sellerProfile");
const multer = require("multer");
const { storage } = require("../config/cloudinaryConfig");
const upload = multer({ storage });
const Product = require("../models/Product");
const Order = require('../models/Orders');
const Cart = require("../models/Cart");


// Middleware to ensure seller access only
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect("/login");
};


const isSeller = (req, res, next) => {
  if (req.session.user?.role === "seller") return next();
  res.status(403).send("Access Denied: Sellers Only");
};

// Sample Dashboard
router.get("/dashboard", isAuthenticated, isSeller, (req, res) => {
  const dashboardData = {
    totalSales: 150,
    totalEarnings: 12000,
    totalOrders: 80,
    stockAlerts: [
      { product: "Car Spoiler", stock: 2 },
      { product: "LED Headlights", stock: 1 }
    ],
    recentOrders: [
      { orderId: "ORD001", customer: "Alice", status: "Shipped" },
      { orderId: "ORD002", customer: "Bob", status: "Processing" },
      { orderId: "ORD003", customer: "Charlie", status: "Delivered" }
    ]
  };

  res.render("Seller/dashboard", { dashboard: dashboardData });
});

// Profile Settings
router.get("/profileSettings", isAuthenticated, isSeller, async (req, res) => {
  try {
    // Fetch the seller profile and populate the user details (name, email, phone)
    const sellerProfile = await SellerProfile.findOne({ sellerId: req.session.user.id }).populate("sellerId", "name email phone");

    // If no seller profile exists, return a default profile with User details
    if (!sellerProfile) {
      return res.render("Seller/profileSettings", {
        profile: {
          storeName: req.session.user.name,
          ownerName: "", 
          contactEmail: req.session.user.email,
          phone: req.session.user.phone,
          address: "",
        }
      });
    }

    // If seller profile exists, return both seller profile and user details
    res.render("Seller/profileSettings", { 
      profile: {
        storeName: sellerProfile.sellerId.name, // Store name from User model
        ownerName: sellerProfile.ownerName, // Owner name from SellerProfile model
        contactEmail: sellerProfile.sellerId.email, // Email from User model
        phone: sellerProfile.sellerId.phone, // Phone from User model
        address: sellerProfile.address, // Address from SellerProfile model
      }
    });
  } catch (error) {
    console.error("Error fetching seller profile:", error);
    res.status(500).send("Error loading profile settings.");
  }
});

router.post("/profileSettings", isAuthenticated, isSeller, async (req, res) => {
  try {
      const { storeName, contactEmail, phone, ownerName, address } = req.body;

      // Update User model (storeName -> name, contactEmail -> email, phone -> phone)
      await User.findByIdAndUpdate(req.session.user.id, {
          name: storeName, 
          email: contactEmail, 
          phone: phone
      });

      // Update SellerProfile model
      await SellerProfile.findOneAndUpdate(
          { sellerId: req.session.user.id },
          { 
              ownerName,
              address,
              sellerId: req.session.user.id  // Ensure sellerId is set
          },
          { new: true, upsert: true }
      );

      console.log("Updated Profile Data:", { storeName, contactEmail, phone, ownerName, address });
      res.redirect("/seller/profileSettings");
  } catch (error) {
      console.error("Error updating seller profile:", error);
      res.status(500).send("Error updating profile settings.");
  }
});

// Orders
const ordersFilePath = path.join(__dirname, '../data', 'orders.json');
const getOrders = () => JSON.parse(fs.readFileSync(ordersFilePath, 'utf8'));
const saveOrders = (orders) => fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');

router.get("/orders", isAuthenticated, isSeller, async (req, res) => {
  try {
    // Find only orders where *this seller* has items
    const sellerId = req.session.user.id;

    const orders = await Order.find({ "items.seller": sellerId })
      .populate('userId', 'name email') // populate customer name + email
      .sort({ placedAt: -1 });

    res.render("Seller/orderManagement", { orders });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading orders');
  }
});

// Earnings & Payouts
const payoutData = {
  totalEarnings: 15000,
  pendingPayouts: 2000,
  availableBalance: 5000,
  transactions: [
    { date: "2024-03-01", amount: 500, status: "Completed" },
    { date: "2024-03-10", amount: 1000, status: "Pending" },
    { date: "2024-03-15", amount: 700, status: "Completed" }
  ]
};

router.get("/earnings-payouts", isAuthenticated, isSeller, (req, res) => {
  res.render("Seller/earningsPayouts", { payoutData });
});

router.post("/request-payout", isAuthenticated, isSeller, (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).send("Invalid payout amount");
  }
  res.redirect("/seller/earnings-payouts");
});

// Reviews
const reviews = JSON.parse(fs.readFileSync('./data/reviews.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));

router.get("/reviews", isAuthenticated, isSeller, (req, res) => {
  res.render("Seller/reviewsRatings", { products, filteredReviews: [], averageRating: 0 });
});

router.get("/reviews/filter", isAuthenticated, isSeller, (req, res) => {
  const { product, rating } = req.query;
  let filteredReviews = reviews;

  if (product) {
    filteredReviews = filteredReviews.filter(review => review.product === product);
  }

  if (rating && rating !== 'all') {
    filteredReviews = filteredReviews.filter(review => String(review.rating) === rating);
  }

  const averageRating = calculateAverageRating(filteredReviews);

  res.render("Seller/reviewsRatings", {
    reviews,
    products,
    filteredReviews,
    averageRating
  });
});

function calculateAverageRating(reviews) {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
}

// Product Management
let products1 = [];

// Assuming this is in routes/seller.js

router.post("/add-product", isAuthenticated, isSeller, upload.single("image"), async (req, res) => {
  try {
    const { name, price, description, category, brand, quantity, sku, compatibility } = req.body;

    // ✅ `req.file.path` will NOT work with Cloudinary.
    // ✅ Use req.file.path only for diskStorage
    // ✅ Use req.file.path (CloudinaryStorage automatically sets this to the secure URL)
    const imageUrl = req.file?.path;


    const newProduct = new Product({
      name,
      price,
      description,
      category,
      brand,
      quantity,
      sku,
      compatibility,
      image: imageUrl,
      seller: req.session.user.id,
    });

    await newProduct.save();
    res.redirect("/Seller/productmanagement");
  } catch (error) {
    console.error("Error adding product:", error.message);
  console.error("Full Error Object:", JSON.stringify(error, null, 2));

  // ✅ If it's a Mongoose ValidationError, print field-wise errors
  if (error.name === 'ValidationError') {
    for (let field in error.errors) {
      console.error(`Validation error on field "${field}": ${error.errors[field].message}`);
    }

    // ✅ Send back field errors as response (optional)
    return res.status(400).send(
      Object.fromEntries(
        Object.entries(error.errors).map(([field, errObj]) => [field, errObj.message])
      )
    );
  }

  res.status(500).send("Internal Server Error");
}
});

// Show only products added by the logged-in seller
router.get("/productmanagement", isAuthenticated, isSeller, async (req, res) => {
  try {
    const sellerId = req.session.user.id; // Assuming req.user is set by your authentication middleware

    const products1 = await Product.find({ seller: sellerId });

    res.render("Seller/productmanagement", { products1 });
  } catch (err) {
    console.error("Error fetching products for seller:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/delete-product/:id", isAuthenticated, isSeller, async (req, res) => {
  try {
    const productId = req.params.id;

    // Step 1: Delete product from Product collection
    await Product.findByIdAndDelete(productId);

    // Step 2: Remove product from all carts
    await Cart.updateMany(
      { "items.productId": productId },
      { $pull: { items: { productId: productId } } }
    );

    res.redirect("/Seller/productmanagement");
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Failed to delete product");
  }
});

router.post('/orders/:orderId/status', isAuthenticated, isSeller, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newStatus } = req.body;

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 🚫 Prevent update if already delivered or cancelled
    if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: `Cannot change status after it's marked as ${order.orderStatus}` });
    }

    // Save previous status before updating
    order.previousStatus = order.orderStatus;
    order.orderStatus = newStatus;

    await order.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;