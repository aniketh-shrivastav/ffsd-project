// models/ServiceBooking.js
const mongoose = require("mongoose");

const ServiceBookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  selectedServices: [{ type: String, required: true }], // names of selected services
  date: { type: Date, required: true },
  phone: { type: String, required: true },
  name: { type: String, required: true },
  carModel: { type: String, required: true },
  address: { type: String, required: true },
  description: { type: String, required: true },
  district: { type: String, required: true },
  status: {
    type: String,
    enum: ["Open", "Confirmed", "Ready", "Rejected", "rejected-by-admin"],
    default: "Open"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ServiceBooking", ServiceBookingSchema);