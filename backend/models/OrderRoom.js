const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    specialInstructions: { type: String, default: '' } // For storing customization details
  });

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
        },
        purchaseDate: {
            type: String,
            required: true,
        },
        customerName: {
            type: String,
            required: true,
        },
        customerID: {
            type: String,
            required: true,
        },
        roomNumber: {
            type: String,  // Add the room number field here
            required: true,
            default: "Take-Away",
        },
        amount : {
            type: Number,
            required: true,
        },
        status : {
            type: String,
            default: "Pending",
        },
        meals: [mealSchema], // Array of mealSchema for added meals
    },
    { timestamps: true }
);

const orderModel = mongoose.model("ordersrooms", orderSchema);
module.exports = orderModel;
