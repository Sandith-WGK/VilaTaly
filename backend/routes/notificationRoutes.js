const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// Fetch all notifications
router.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create a new notification
router.post("/notifications", async (req, res) => {
  try {
    const { message } = req.body;
    const newNotification = new Notification({ message });
    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete all notifications
router.delete("/notifications", async (req, res) => {
  try {
    // Delete all documents in the Notification collection
    const result = await Notification.deleteMany({});
    res.status(200).json({
      message: "All notifications deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;