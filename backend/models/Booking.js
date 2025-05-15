const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: "RoomPackage", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  guestPhone: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed"], default: "pending" },
});

module.exports = mongoose.model("Booking", BookingSchema);