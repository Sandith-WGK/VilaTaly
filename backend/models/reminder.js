const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    userId: {
        type: String, // User ID as a string
        required: true,
    },
    userEmail: {
        type: String,  // User email
        required: true,
    },
    eventId: {
        type: String,
        required: true,
    },
    reminderTime: {
        type: Date,  // This will store the exact reminder time (picked date or 1 day before)
        required: true,
    },
    sentStatus: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
