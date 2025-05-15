const express = require('express');
const router = express.Router();
const RoomPackage = require('../models/RoomPackage');
const RoomType = require('../models/RoomType');
const Booking = require('../models/Booking');
const Discount = require('../models/Discount');
const { upload, uploadToImgBB } = require('../config/imageUpload');

// Get all room packages
router.get('/getPackages', async (req, res) => {
  const { checkInDate, checkOutDate, discountStartDate, discountEndDate } = req.query;
  console.log("Fetching packages with query:", { checkInDate, checkOutDate, discountStartDate, discountEndDate });

  try {
    let packageQuery = {};

    // Handle discount date range filtering
    if (discountStartDate && discountEndDate) {
      const discountStart = new Date(discountStartDate);
      const discountEnd = new Date(discountEndDate);
      packageQuery = {
        $and: [
          { startDate: { $lte: discountEnd } },
          { endDate: { $gte: discountStart } },
        ],
      };
    }

    // Add date range filtering for checkInDate and checkOutDate
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      if (isNaN(checkIn) || isNaN(checkOut)) {
        return res.status(400).json({ message: "Invalid check-in or check-out date" });
      }
      packageQuery.$and = packageQuery.$and || [];
      packageQuery.$and.push(
        { startDate: { $lte: checkOut } }, // Package starts before check-out
        { endDate: { $gte: checkIn } } // Package ends after check-in
      );
    }

    const packages = await RoomPackage.find(packageQuery).populate('roomType');
    console.log("Packages found:", packages.length);
    if (!packages.length) {
      return res.status(200).json({ packages: [] });
    }

    const discounts = await Discount.find({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });
    console.log("Discounts found:", discounts.length);

    const availablePackages = await Promise.all(
      packages.map(async (pkg) => {
        if (!pkg.roomType || !pkg.roomType.totalRooms) {
          console.error(`Package ${pkg._id} has invalid or missing roomType:`, pkg.roomType);
          return null;
        }

        const checkIn = checkInDate ? new Date(checkInDate) : null;
        const checkOut = checkOutDate ? new Date(checkOutDate) : null;
        if (checkInDate && isNaN(checkIn)) {
          console.warn(`Invalid checkInDate: ${checkInDate}`);
          return null;
        }
        if (checkOutDate && isNaN(checkOut)) {
          console.warn(`Invalid checkOutDate: ${checkOutDate}`);
          return null;
        }

        const bookingQuery = {
          package: pkg._id,
          status: 'confirmed',
        };
        if (checkIn && checkOut) {
          bookingQuery.checkInDate = { $lte: checkOut };
          bookingQuery.checkOutDate = { $gte: checkIn };
        }
        const bookings = await Booking.countDocuments(bookingQuery);
        console.log(`Package ${pkg._id} - Bookings: ${bookings}`);

        const availableRooms = pkg.roomType.totalRooms - bookings;
        if (availableRooms <= 0 && checkIn && checkOut) {
          console.log(`Package ${pkg._id} has no available rooms`);
          return null;
        }

        let discountedPrice = pkg.basePrice;
        const applicableDiscount = discounts.find((d) =>
          d.applicablePackages.length === 0 ||
          d.applicablePackages.some((id) => id && id.toString() === pkg._id.toString())
        );
        if (applicableDiscount) {
          discountedPrice = applicableDiscount.type === 'percentage'
            ? pkg.basePrice * (1 - applicableDiscount.value / 100)
            : pkg.basePrice - applicableDiscount.value;
        }

        return {
          ...pkg.toObject(),
          availableRooms: checkIn ? availableRooms : pkg.roomType.totalRooms,
          basePrice: pkg.basePrice,
          discountedPrice,
          discountApplied: !!applicableDiscount,
        };
      })
    );

    const filteredPackages = availablePackages.filter((pkg) => pkg !== null);
    console.log("Returning packages:", filteredPackages.length);
    res.status(200).json({ packages: filteredPackages });
  } catch (error) {
    console.error("Error in getPackages:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get package by ID
router.get('/getPackage/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pkg = await RoomPackage.findById(id).populate('roomType');
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const discounts = await Discount.find({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    let discountedPrice = pkg.basePrice;
    const applicableDiscount = discounts.find(d =>
      d.applicablePackages.length === 0 || d.applicablePackages.includes(pkg._id)
    );
    if (applicableDiscount) {
      discountedPrice = applicableDiscount.type === 'percentage'
        ? pkg.basePrice * (1 - applicableDiscount.value / 100)
        : pkg.basePrice - applicableDiscount.value;
    }

    res.status(200).json({
      package: {
        ...pkg.toObject(),
        discountedPrice,
        discountApplied: !!applicableDiscount,
      }
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Add new package
router.post('/addPackage', upload.single('image'), async (req, res) => {
  const { name, roomType, basePrice, capacity, features, startDate, endDate } = req.body;
  let imageUrl = null;

  try {
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for comparison

    if (start < now) {
      return res.status(400).json({ message: 'Start date must be today or in the future' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Upload image to ImgBB if file exists
    if (req.file) {
      imageUrl = await uploadToImgBB(req.file);
    }

    // Validate roomType exists
    const roomTypeExists = await RoomType.findById(roomType);
    if (!roomTypeExists) {
      return res.status(400).json({ message: 'Invalid room type' });
    }

    // Find the last package to determine the next packageId
    const lastPackage = await RoomPackage.findOne({}, {}, { sort: { 'packageId': -1 } });
    let packageId = 'PKG-001';
    
    if (lastPackage && lastPackage.packageId) {
      const lastNumber = parseInt(lastPackage.packageId.split('-')[1]);
      packageId = `PKG-${String(lastNumber + 1).padStart(3, '0')}`;
    }

    const newPackage = new RoomPackage({
      packageId,
      name,
      roomType,
      basePrice,
      capacity,
      features,
      image: imageUrl,
      startDate: start,
      endDate: end,
    });

    const pkg = await newPackage.save();
    res.status(201).json({ package: pkg });
  } catch (error) {
    console.error('Error adding package:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update package
router.put('/updatePackage/:id', upload.single('image'), async (req, res) => {
  const { name, roomType, basePrice, capacity, features, startDate, endDate } = req.body;
  let imageUrl = req.body.image; // Keep existing image URL by default

  try {
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for comparison

    if (start < now) {
      return res.status(400).json({ message: 'Start date must be today or in the future' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Upload new image to ImgBB if file exists
    if (req.file) {
      imageUrl = await uploadToImgBB(req.file);
    }

    const updatedPackage = await RoomPackage.findByIdAndUpdate(
      req.params.id,
      {
        name,
        roomType,
        basePrice,
        capacity,
        features,
        image: imageUrl,
        startDate: start,
        endDate: end,
      },
      { new: true }
    ).populate('roomType');

    if (!updatedPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    res.json({ package: updatedPackage });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete package
router.delete('/deletePackage/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPackage = await RoomPackage.findByIdAndDelete(id);
    if (!deletedPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }
    res.status(200).json({ package: deletedPackage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New route to get all room types
router.get("/getRoomTypes", async (req, res) => {
  try {
    const roomTypes = await RoomType.find();
    res.status(200).json({ roomTypes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to add a new room type
router.post("/addRoomType", async (req, res) => {
  try {
    const { name, totalRooms, description } = req.body;

    // Check if the room type already exists
    const existingRoomType = await RoomType.findOne({ name });
    if (existingRoomType) {
      return res.status(400).json({ message: "Room type already exists" });
    }

    // Create a new room type
    const newRoomType = new RoomType({
      name,
      totalRooms,
      description,
    });

    await newRoomType.save();
    res.status(201).json({ message: "Room type added successfully", newRoomType });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;