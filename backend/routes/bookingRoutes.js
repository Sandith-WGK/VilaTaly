const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const RoomPackage = require("../models/RoomPackage");
const EmailService = require("../utils/emailService");



// Get all bookings for admin
router.get("/allBookings", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (search) {
      query.$or = [
        { guestName: { $regex: search, $options: 'i' } },
        { guestEmail: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate("packageId")
      .populate("userId")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalBookings: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get("/userBookings", async (req, res) => {
  try {
    const { userId } = req.query;
    const bookings = await Booking.find({ userId })
      .populate("packageId")
      .sort({ createdAt: -1 });

    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Update booking status
router.post("/updateStatus/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const oldBooking = await Booking.findById(req.params.id).populate("packageId").populate("userId");
    
    if (!oldBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("packageId").populate("userId");

    // Send email notification if status changed
    if (oldBooking.status !== status) {
      try {
        await EmailService.sendBookingStatusNotification(booking, status);
        console.log(`Email notification sent to ${booking.guestEmail} for status change to ${status}`);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({ 
      booking, 
      message: "Booking status updated" + (oldBooking.status !== status ? " and notification sent" : "")
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new booking
router.post("/reservePackage", async (req, res) => {
  const { packageId, userId, checkInDate, checkOutDate, guestName, guestEmail, guestPhone, totalAmount } = req.body;

  try {
    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      packageId,
      status: "confirmed",
      $or: [
        { checkInDate: { $lt: new Date(checkOutDate) }, checkOutDate: { $gt: new Date(checkInDate) } },
      ],
    });

    const package = await RoomPackage.findById(packageId).populate("roomType");
    if (!package) {
      return res.status(404).json({ message: "Package not found." });
    }

    if (overlappingBookings.length >= package.roomType.totalRooms) {
      return res.status(400).json({ message: "No available rooms for the selected dates." });
    }

    // Create booking
    const newBooking = new Booking({
      packageId,
      userId,
      checkInDate,
      checkOutDate,
      guestName,
      guestEmail,
      guestPhone,
      totalAmount,
      status: "pending", // Set status to pending until payment is confirmed
    });

    await newBooking.save();
    res.status(201).json({ booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Confirm booking after payment
router.post("/confirmBooking/:bookingId", async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findById(bookingId).populate("packageId").populate("userId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Update booking status to confirmed
    booking.status = "confirmed";
    await booking.save();

    // Send confirmation email
    try {
      await EmailService.sendBookingStatusNotification(booking, "confirmed");
      console.log(`Confirmation email sent to ${booking.guestEmail}`);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({ booking, message: "Booking confirmed successfully and notification sent!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available dates for a package
router.get("/availableDates/:packageId", async (req, res) => {
  const { packageId } = req.params;

  try {
    const package = await RoomPackage.findById(packageId).populate("roomType");
    if (!package) {
      return res.status(404).json({ message: "Package not found." });
    }

    const bookings = await Booking.find({ packageId, status: "confirmed" });
    const totalRooms = package.roomType.totalRooms;

    // Find fully booked dates
    const fullyBookedDates = [];
    bookings.forEach((booking) => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      for (let d = checkIn; d <= checkOut; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        if (!fullyBookedDates.includes(dateStr)) {
          fullyBookedDates.push(dateStr);
        }
      }
    });

    res.status(200).json({ fullyBookedDates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


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


// Update booking status
router.put("/updateStatus/:id", async (req, res) => {
  try {
    const { guestName, guestEmail, guestPhone } = req.body;
    const updateFields = {};
    
    if (guestName) updateFields.guestName = guestName;
    if (guestEmail) updateFields.guestEmail = guestEmail;
    if (guestPhone) updateFields.guestPhone = guestPhone;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate("packageId").populate("userId");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ booking, message: "Booking updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;