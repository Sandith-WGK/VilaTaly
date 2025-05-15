const mongoose = require("mongoose");

const dailyUsageSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, required: true },
  items: [
    {
      item: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true },
      quantityUsed: { type: Number, required: true, min: 1 },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DailyUsage", dailyUsageSchema);