const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // e.g., "Deluxe", "Luxury"
  },
  totalRooms: {
    type: Number,
    required: true, // e.g., 5 for Deluxe
    min: 1,
  },
  description: {
    type: String, // e.g., "Spacious rooms with a view"
  },
}, { timestamps: true });

module.exports = mongoose.model('RoomType', roomTypeSchema);