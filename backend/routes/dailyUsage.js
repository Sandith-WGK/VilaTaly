const express = require("express");
const router = express.Router();
const DailyUsage = require("../models/dailyUsageSchema");
const Inventory = require("../models/inventorySchema");

// Get all inventory items for dropdown
router.get("/items", async (req, res) => {
  try {
    const items = await Inventory.find({}, "itemID name stockQuantity").lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory items" });
  }
});

// Create a daily usage record
router.post("/add", async (req, res) => {
  try {
    const { date, items } = req.body;

    // Validate items
    if (!items || items.length === 0 || items.length > 5) {
      return res.status(400).json({ error: "Must provide 1-5 items" });
    }

    // Check if items exist and have sufficient stock
    for (const { item, quantityUsed } of items) {
      const inventoryItem = await Inventory.findById(item);
      if (!inventoryItem) {
        return res.status(400).json({ error: `Item ${item} not found` });
      }
      if (inventoryItem.stockQuantity < quantityUsed) {
        return res.status(400).json({ error: `Insufficient stock for ${inventoryItem.name}` });
      }
    }

    // Create daily usage record
    const dailyUsage = new DailyUsage({ date, items });
    await dailyUsage.save();

    // Update inventory stock quantities
    for (const { item, quantityUsed } of items) {
      await Inventory.findByIdAndUpdate(item, {
        $inc: { stockQuantity: -quantityUsed },
      });
    }

    res.status(201).json({ message: "Daily usage recorded successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all daily usage records
router.get("/history", async (req, res) => {
  try {
    const usageRecords = await DailyUsage.find()
      .populate("items.item", "itemID name")
      .lean();
    res.json(usageRecords);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch daily usage history" });
  }
});

module.exports = router;