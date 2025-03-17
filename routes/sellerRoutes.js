const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

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
router.get("/dashboard", isSeller, isAuthenticated, (req, res) => {
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
router.get("/profileSettings", isSeller, isAuthenticated, (req, res) => {
  const profileData = {
    storeName: "",
    ownerName: "",
    contactEmail: "",
    phone: "",
    address: "",
    workingHours: ""
  };
  res.render("Seller/profileSettings", { profile: profileData });
});

router.post("/profile-settings", isSeller, isAuthenticated, (req, res) => {
  console.log("Updated Profile Data:", req.body);
  res.redirect("/seller/profileSettings");
});

// Orders
const ordersFilePath = path.join(__dirname, '../data', 'orders.json');
const getOrders = () => JSON.parse(fs.readFileSync(ordersFilePath, 'utf8'));
const saveOrders = (orders) => fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');

router.get("/orders", isSeller, isAuthenticated, (req, res) => {
  const orders = getOrders();
  res.render("Seller/orderManagement", { orders });
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

router.get("/earnings-payouts", isSeller, isAuthenticated, (req, res) => {
  res.render("Seller/earningsPayouts", { payoutData });
});

router.post("/request-payout", isSeller, isAuthenticated, (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).send("Invalid payout amount");
  }
  console.log(`Payout request submitted: $${amount}`);
  res.redirect("/seller/earnings-payouts");
});

// Reviews
const reviews = JSON.parse(fs.readFileSync('./data/reviews.json', 'utf8'));
const products = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));

router.get("/reviews", isSeller, isAuthenticated, (req, res) => {
  res.render("Seller/reviewsRatings", { products, filteredReviews: [], averageRating: 0 });
});

router.get("/reviews/filter", isSeller, isAuthenticated, (req, res) => {
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

router.get("/productmanagement", isSeller, isAuthenticated, (req, res) => {
  res.render("Seller/productManagement", { products1 });
});

router.post("/add-product", isSeller, isAuthenticated, (req, res) => {
  const { name, price, description, category, brand, quantity, sku } = req.body;
  const product = {
    id: Date.now(),
    name,
    price,
    description,
    category,
    brand,
    quantity,
    sku
  };
  products1.push(product);
  res.redirect("/Seller/productmanagement");
});

router.post("/delete-product/:id", isSeller, isAuthenticated, (req, res) => {
  const productId = parseInt(req.params.id);
  products1 = products1.filter(product => product.id !== productId);
  res.redirect("/Seller/productmanagement");
});

module.exports = router;
