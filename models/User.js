const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    role: { type: String, enum: ["customer", "seller", "service-provider", "manager"], required: true },
    createdAt: { type: Date, default: Date.now },
    suspended: { type: Boolean, default: false },
    businessName: String,
    workshopName: String,
    profilePicture: String,
    address: String,
    servicesOffered: [String] // New field to store list of services
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
