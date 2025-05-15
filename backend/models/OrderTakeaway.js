const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  specialInstructions: { type: String, default: '' } // For storing customization details
});

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  customerID: {
    type: String,
    required: true, // Linking to a User model
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  address: addressSchema, // Using an embedded address schema
  meals: [mealSchema], // Array of mealSchema for added meals
  orderType: {
    type: String,
    required: true,
    enum: ['delivery', 'takeaway']
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  scheduledDeliveryTime: {
    type: Date, // For scheduling orders
  },
  status: {
    type: String,
    default: "Pending",
    enum: ['Pending', 'Preparing', 'Ready', 'Completed']
  },
  purchaseDate: {
    type: Date,
    default: Date.now // Automatically captures the date when the order is made
  },
}, { timestamps: true });

orderSchema.pre('validate', function(next) {
  if (this.orderType === 'takeaway') {
    this.address = undefined; // Remove address for takeaway orders
  }
  next();
});

const MealOrder = mongoose.model("ordertakeaways", orderSchema);

module.exports = MealOrder;
