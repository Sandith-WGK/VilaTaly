const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemID: { type: String, unique: true },
  name: { type: String },
  category: { type: String },
  type: { type: String },
  stockQuantity: { type: Number },
  unit: { type: String },
  perItemPrice: { type: Number }, // ✅ New field
  price: { type: Number }, 
  status: { type: String, default: "In Stock" },
  purchaseDate: { type: Date },
  expirationDate: { type: Date },
  supplier: { type: String },
  minStockLevel: { type: Number },
  
  purchaseHistory: [
    {
      purchaseDate: { type: Date },
      quantity: { type: Number },
      supplier: { type: String },
    },
  ],
});

module.exports = mongoose.model("Inventory", inventorySchema);
