const mongoose = require('mongoose');

const eventBookingSchema = new mongoose.Schema({
    bookingID: {
        type: String,
        required: true,
        unique: true // Ensure bookingID is unique
    },
    eventId: {
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
    guestPhone: {
        type: String,
        required: true,
    },
    eventDate: {
        type: Date,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    userID: {  // Add userID to the schema
        type: String,
        required: true,
    }
}, { timestamps: true });

const eventBookingModel = mongoose.model("eventBooking", eventBookingSchema);
module.exports = eventBookingModel;
