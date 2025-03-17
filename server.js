const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");

const app = express();

// Middleware Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));

// Routes
const authRoutes = require("./routes/authRoutes");
const managerRoutes = require("./routes/managerRoutes");
const customerRoutes = require("./routes/customerRoutes");
const serviceProviderRoutes = require("./routes/serviceProviderRoutes");
const { router: contactRoutes } = require("./routes/contactRoutes");
const sellerRoutes = require("./routes/sellerRoutes");


app.use("/", authRoutes);
app.use("/manager", managerRoutes);
app.use("/customer", customerRoutes);
app.use("/service", serviceProviderRoutes);
app.use("/", contactRoutes);
app.use("/seller", sellerRoutes);


// Start Server
app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
