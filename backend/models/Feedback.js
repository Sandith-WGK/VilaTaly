const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    userID: {
        type: String,  // Keep userID as a string
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: String,  // Store as string, not ObjectId
    }],
    dislikedBy: [{
        type: String,  // Store as string, not ObjectId
    }]
}, {
    timestamps: true
});

const feedbackModel = mongoose.model('feedbacks', FeedbackSchema);
module.exports = feedbackModel;
