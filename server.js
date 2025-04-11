const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const connectDB = require("./db");
const User = require("./models/User"); //Import the User model

const app = express();
connectDB();

// Middleware Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Ensure `User` is defined before using it
(async () => {
  try {
    await User.updateMany({}, { $set: { suspended: false } });
    console.log("Reset all user suspensions on startup");
  } catch (err) {
    console.error("Error resetting user suspensions:", err);
  }
})();

// Routes
const authRoutes = require("./routes/authRoutes");
const managerRoutes = require("./routes/managerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const serviceProviderRoutes = require("./routes/serviceProviderRoutes");
const { router: contactRoutes } = require("./routes/contactRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const profileSettingsRoutes = require("./routes/profileSettingsRoutes");
const cartRoutes = require("./routes/cartRoutes");

app.use("/", profileSettingsRoutes);
app.use("/", authRoutes);
app.use("/manager", managerRoutes);
app.use("/customer", customerRoutes);
app.use("/service", serviceProviderRoutes);
app.use("/", contactRoutes);
app.use("/seller", sellerRoutes);
app.use("/api/cart", cartRoutes);
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// Start Server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
