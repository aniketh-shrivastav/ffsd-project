const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const connectDB = require("./db");
const User = require("./models/User");
const dashboardRoutes = require("./routes/dashboardRoutes");
 //Import the User model

const app = express();
connectDB();

app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Middleware Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));


// Routes
const authRoutes = require("./routes/authRoutes");
const managerRoutes = require("./routes/managerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const serviceProviderRoutes = require("./routes/serviceProviderRoutes");
const { router: contactRoutes } = require("./routes/contactRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const profileSettingsRoutes = require("./routes/profileSettingsRoutes");
const cartRoutes = require("./routes/cartRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

app.use("/", profileSettingsRoutes);
app.use("/", authRoutes);
app.use("/manager", managerRoutes);
app.use("/customer", customerRoutes);
app.use("/service", serviceProviderRoutes);
app.use("/", contactRoutes);
app.use("/seller", sellerRoutes);
app.use("/api/cart", cartRoutes);
app.use("/bookings", bookingRoutes);
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
// app.use((err, req, res, next) => {
//   console.error("GLOBAL ERROR HANDLER:", JSON.stringify(err, null, 2));
//   res.status(500).send("Something went wrong!");
// });

// Start Server
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
