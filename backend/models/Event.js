const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
    },
    eventName: {
        type: String,
        required: true,
    },
    eventType: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    baseImage: {
        type: String,
        required: true,
    }

}, { timestamps: true });

const eventModel = mongoose.model("events", eventSchema);
module.exports = eventModel;