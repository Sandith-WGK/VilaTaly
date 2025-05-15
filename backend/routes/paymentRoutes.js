const express = require("express");
const router = express.Router();

// Simulate payment processing
router.post("/process", async (req, res) => {
  const { cardNumber, expiryDate, cvv, amount } = req.body;

  try {
    // Simulate payment validation
    if (!cardNumber || !expiryDate || !cvv) {
      return res.status(400).json({ message: "Invalid payment details." });
    }

    // Simulate payment success
    res.status(200).json({ success: true, message: "Payment successful!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;