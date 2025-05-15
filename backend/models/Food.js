const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  image: { type: String, required: true },
  itemID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  type: { type: String, required: true },
  stockQuantity: { type: Number, required: true },
  unit: { type: String, required: true },
  minStockLevel: { type: Number, required: true },
  reorderLevel: { type: Number, required: true },
  supplier: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  expirationDate: { type: Date, required: true },
  storageLocation: { type: String },
  status: {
    type: String,
    enum: ["In Stock", "Low Stock", "Out of Stock", "Expired"],
    default: "In Stock",
  },
});

const Food = mongoose.model("Food", foodSchema);
module.exports = Food;
