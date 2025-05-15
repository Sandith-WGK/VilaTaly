const mongoose = require("mongoose");

const packageBookingSchema = new mongoose.Schema({
  bookingID: {
    type: String,
    required: true,
    unique: true,
  },
  userID: {
    type: String, // Now stored as a string instead of ObjectId
    required: true,
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "packages",
    required: true,
  },
  guestName: {
    type: String,
    required: true,
  },
  guestEmail: {
    type: String,
    required: true,
  },
  guestPhone: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PackageBooking = mongoose.model("PackageBooking", packageBookingSchema);

module.exports = PackageBooking;
