const mongoose = require("mongoose");

// Define the Room Reservation schema
const ReservationSchema = new mongoose.Schema(
      {
            bookingID: {
                  type: String,
                  required: true,
                  unique: true,
            },
            userID: {
                  type: String,
                  required: true,
            },
            roomNumber: {
                  type: String,
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
            packages: {
                  type: [String],
                  required: true,
            },
            guestPhone: {
                  type: String,
                  required: true,
            },
            checkInDate: {
                  type: Date,
                  required: true,
            },
            checkOutDate: {
                  type: Date,
                  required: true,
            },
            totalAmount: {
                  type: Number,
                  required: true,
            },
      },
      {
            timestamps: true, // Automatically add createdAt and updatedAt fields
      }
);

const Reservation = mongoose.model("Reservation", ReservationSchema);

module.exports = Reservation;
