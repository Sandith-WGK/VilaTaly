const mongoose = require('mongoose');

// Define the Room schema
const roomSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
    },
    roomNumber: {
        type: String,
        required: true,
        unique: true, // Ensure roomNumber is unique
    },
    roomType: {
        type: String,
        required: true,
    },
    bedType: {
        type: String,
        required: true,
    },
    size: {
        type: String,
        required: true,
    },
    viewInformation:{
        type: String,
    },
    facilities: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    amenities: {
        type: [String],
        required: true,
    },
    status: {
        type: String,
        enum: ['Activate', 'Suspended'],
        default: 'Activate',
    },
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Create the Room model
const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
