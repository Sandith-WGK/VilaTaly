const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking'); // Assuming you have a Booking model

// Route to get all bookings
router.get('/getBookings', async (req, res) => {
  try {
    const bookings = await Booking.find(); // Fetch all bookings from the database
    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;