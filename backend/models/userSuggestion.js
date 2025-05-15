const mongoose = require('mongoose');

// Define the UserSuggestion schema
const userSuggestionSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users', // Reference to User model (if you have one)
      required: true,
    },
    rooms: {
      type: [mongoose.Schema.Types.ObjectId], // Array of room IDs that user has viewed
      ref: 'Room', // Reference to Room model
      required: true,
    },
  }, {
    timestamps: true
  });  

// Create and export the model
const UserSuggestion = mongoose.model('UserSuggestion', userSuggestionSchema);
module.exports = UserSuggestion;
