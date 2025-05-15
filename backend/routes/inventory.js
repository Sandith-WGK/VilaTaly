const express = require("express");
const { body, param, validationResult } = require("express-validator");
const router = express.Router();
const Inventory = require("../models/inventorySchema");
const cron = require("node-cron");

// Middleware for validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Utility to calculate total price
const calculateTotalPrice = (body) => {
  const qty = Number(body.stockQuantity || 0);
  const perPrice = Number(body.perItemPrice || 0);
  body.price = parseFloat((qty * perPrice).toFixed(2)); // Calculate total
};

// @desc   Add a new inventory item

router.post(
  "/addItem",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("stockQuantity")
      .isNumeric()
      .withMessage("Stock quantity must be a number"),
    body("unit").notEmpty().withMessage("Unit is required"),
  ],
  validate,
  async (req, res) => {
    try {
      calculateTotalPrice(req.body); // ✅ Compute total price
      const newItem = new Inventory(req.body);
      const savedItem = await newItem.save();
      res.status(201).json(savedItem);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// @desc   Get all inventory items
router.get("/getItems", async (req, res) => {
  try {
    const items = await Inventory.find();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc   Get a single inventory item by ID
router.get(
  "/getItem/:id",
  [param("id").isMongoId().withMessage("Invalid inventory ID")],
  validate,
  async (req, res) => {
    try {
      const item = await Inventory.findById(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.status(200).json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// @desc   Update inventory item

router.put(
  "/updateItem/:id",
  [
    param("id").isMongoId().withMessage("Invalid inventory ID"),
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("stockQuantity")
      .optional()
      .isNumeric()
      .withMessage("Stock quantity must be a number"),
    body("perItemPrice")
      .optional()
      .isNumeric()
      .withMessage("Per item price must be a number"),
  ],
  validate,
  async (req, res) => {
    try {
      calculateTotalPrice(req.body); // ✅ Always recalculate on update
      const updatedItem = await Inventory.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.status(200).json(updatedItem);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// @desc   Delete an inventory item by ID
router.delete(
  "/deleteItem/:id",
  [param("id").isMongoId().withMessage("Invalid inventory ID")],
  validate,
  async (req, res) => {
    try {
      const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
      if (!deletedItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res
        .status(200)
        .json({
          message: "Inventory item deleted successfully",
          item: deletedItem,
        });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// @desc   Check for low stock and send alerts
router.get("/checkLowStock", async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lt: ["$stockQuantity", "$minStockLevel"] }, // Compare fields
    });
    if (lowStockItems.length > 0) {
      // Send notification (e.g., email or push notification)
      console.log("Low stock items:", lowStockItems);
    }
    res.status(200).json(lowStockItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @desc   Check for expired items and notify admins
// @desc   Check for expired items and notify admins
router.get("/checkExpiredItems", async (req, res) => {
  try {
    const expiredItems = await Inventory.find({
      expirationDate: { $lt: new Date() },
    });
    if (expiredItems.length > 0) {
      // Send notification (e.g., email or push notification)
      console.log("Expired items:", expiredItems);
      res.status(200).json(expiredItems);
    } else {
      res
        .status(200)
        .json({ message: "No expired items found.", expiredItems: [] });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// @desc   Place order and update stock
router.post("/orderStock/:id", async (req, res) => {
  try {
    const { quantity, supplier } = req.body;

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Update stock
    item.stockQuantity += quantity;

    // Save order in purchase history
    item.purchaseHistory.push({
      quantity,
      supplier: supplier || item.supplier,
      purchaseDate: new Date(),
    });

    const updatedItem = await item.save();

    res.status(200).json({
      message: "Stock ordered successfully",
      item: updatedItem,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
