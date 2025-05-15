const express = require('express');
const router = express.Router();
const Discount = require('../models/Discount');
const RoomPackage = require('../models/RoomPackage');

// Get all discounts
router.get('/getDiscounts', async (req, res) => {
  try {
    const discounts = await Discount.find().populate('applicablePackages');
    res.status(200).json({ discounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active discounts
router.get('/getActiveDiscounts', async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('applicablePackages');
    
    res.status(200).json({ discounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get discount by ID
router.get('/getDiscount/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const discount = await Discount.findById(id).populate('applicablePackages');
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.status(200).json({ discount });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Add new discount
router.post('/addDiscount', async (req, res) => {
  const { name, description, type, value, applicablePackages, startDate, endDate, property } = req.body;

  try {
    const now = new Date();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (end < now) {
      return res.status(400).json({ message: "End date must be in the future" });
    }
    if (end < start) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    const existingDiscountByName = await Discount.findOne({ name });
    if (existingDiscountByName) {
      return res.status(400).json({ message: "A discount with this name already exists" });
    }

    if (property) {
      const existingDiscountByProperty = await Discount.findOne({ property });
      if (existingDiscountByProperty) {
        return res.status(400).json({ message: "A discount already exists for this property" });
      }
    }

    // Validate discount value for fixed type
    if (type === 'fixed' && value > 0) {
      let relevantPackages;
      if (applicablePackages && applicablePackages.length > 0) {
        relevantPackages = await RoomPackage.find({ _id: { $in: applicablePackages } });
      } else {
        relevantPackages = await RoomPackage.find();
      }
      if (relevantPackages.length > 0) {
        const minBasePrice = Math.min(...relevantPackages.map(pkg => pkg.basePrice));
        if (value > minBasePrice) {
          return res.status(400).json({
            message: `Fixed discount value of $${value} cannot exceed the minimum package price of $${minBasePrice}`
          });
        }
      }
    } else if (type === 'percentage' && (value <= 0 || value > 100)) {
      return res.status(400).json({ message: "Percentage discount must be between 0 and 100" });
    }

    // Validate package date ranges (allow any overlap, normalize to start/end of day)
    if (applicablePackages && applicablePackages.length > 0) {
      const packages = await RoomPackage.find({ _id: { $in: applicablePackages } });
      for (const pkg of packages) {
        const pkgStart = new Date(pkg.startDate);
        pkgStart.setHours(0, 0, 0, 0);
        const pkgEnd = new Date(pkg.endDate);
        pkgEnd.setHours(23, 59, 59, 999);
        // Overlap: discountStart <= packageEnd && discountEnd >= packageStart
        if (start > pkgEnd || end < pkgStart) {
          return res.status(400).json({
            message: `Discount dates do not overlap with package ${pkg.name} dates`
          });
        }
      }

      // Check for overlapping discounts with the exact same applicable packages
      const existingDiscountByPackages = await Discount.findOne({
        applicablePackages: { $all: applicablePackages }, // Must match all packages exactly
        $or: [
          { startDate: { $lte: start }, endDate: { $gte: start } },
          { startDate: { $lte: end }, endDate: { $gte: end } },
          { startDate: { $gte: start }, endDate: { $lte: end } }
        ]
      });

      if (existingDiscountByPackages) {
        return res.status(400).json({
          message: "A discount already exists for the specified packages during the selected date range"
        });
      }
    }

    const isAllPackages = !applicablePackages || applicablePackages.length === 0;
    if (isAllPackages) {
      const existingAllPackagesDiscount = await Discount.findOne({
        $or: [
          { applicablePackages: { $exists: false } },
          { applicablePackages: { $size: 0 } }
        ],
        $or: [
          { startDate: { $lte: start }, endDate: { $gte: start } },
          { startDate: { $lte: end }, endDate: { $gte: end } },
          { startDate: { $gte: start }, endDate: { $lte: end } }
        ]
      });

      if (existingAllPackagesDiscount) {
        return res.status(400).json({
          message: "An 'All Packages' discount with overlapping dates already exists"
        });
      }
    }

    const newDiscount = new Discount({
      name,
      description,
      type,
      value,
      applicablePackages: Array.isArray(applicablePackages) ? applicablePackages : [],
      startDate: start,
      endDate: end,
      property,
    });

    const discount = await newDiscount.save();
    res.status(201).json({ discount });
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update discount
router.put('/updateDiscount/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, type, value, applicablePackages, startDate, endDate, property } = req.body;

  try {
    const now = new Date();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (end < now) {
      return res.status(400).json({ message: "End date must be in the future" });
    }
    if (end < start) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    const existingDiscountByName = await Discount.findOne({ name, _id: { $ne: id } });
    if (existingDiscountByName) {
      return res.status(400).json({ message: "A discount with this name already exists" });
    }

    if (property) {
      const existingDiscountByProperty = await Discount.findOne({ property, _id: { $ne: id } });
      if (existingDiscountByProperty) {
        return res.status(400).json({ message: "A discount already exists for this property" });
      }
    }

    // Validate discount value for fixed type
    if (type === 'fixed' && value > 0) {
      let relevantPackages;
      if (applicablePackages && applicablePackages.length > 0) {
        relevantPackages = await RoomPackage.find({ _id: { $in: applicablePackages } });
      } else {
        relevantPackages = await RoomPackage.find();
      }
      if (relevantPackages.length > 0) {
        const minBasePrice = Math.min(...relevantPackages.map(pkg => pkg.basePrice));
        if (value > minBasePrice) {
          return res.status(400).json({
            message: `Fixed discount value of $${value} cannot exceed the minimum package price of $${minBasePrice}`
          });
        }
      }
    } else if (type === 'percentage' && (value <= 0 || value > 100)) {
      return res.status(400).json({ message: "Percentage discount must be between 0 and 100" });
    }

    // Validate package date ranges (allow any overlap, normalize to start/end of day)
    if (applicablePackages && applicablePackages.length > 0) {
      const packages = await RoomPackage.find({ _id: { $in: applicablePackages } });
      for (const pkg of packages) {
        const pkgStart = new Date(pkg.startDate);
        pkgStart.setHours(0, 0, 0, 0);
        const pkgEnd = new Date(pkg.endDate);
        pkgEnd.setHours(23, 59, 59, 999);
        // Overlap: discountStart <= packageEnd && discountEnd >= packageStart
        if (start > pkgEnd || end < pkgStart) {
          return res.status(400).json({
            message: `Discount dates do not overlap with package ${pkg.name} dates`
          });
        }
      }

      // Check for overlapping discounts with the exact same applicable packages
      const existingDiscountByPackages = await Discount.findOne({
        _id: { $ne: id },
        applicablePackages: { $all: applicablePackages }, // Must match all packages exactly
        $or: [
          { startDate: { $lte: start }, endDate: { $gte: start } },
          { startDate: { $lte: end }, endDate: { $gte: end } },
          { startDate: { $gte: start }, endDate: { $lte: end } }
        ]
      });

      if (existingDiscountByPackages) {
        return res.status(400).json({
          message: "A discount already exists for the specified packages during the selected date range"
        });
      }
    }

    const isAllPackages = !applicablePackages || applicablePackages.length === 0;
    if (isAllPackages) {
      const existingAllPackagesDiscount = await Discount.findOne({
        _id: { $ne: id },
        $or: [
          { applicablePackages: { $exists: false } },
          { applicablePackages: { $size: 0 } }
        ],
        $or: [
          { startDate: { $lte: start }, endDate: { $gte: start } },
          { startDate: { $lte: end }, endDate: { $gte: end } },
          { startDate: { $gte: start }, endDate: { $lte: end } }
        ]
      });

      if (existingAllPackagesDiscount) {
        return res.status(400).json({
          message: "An 'All Packages' discount with overlapping dates already exists"
        });
      }
    }

    const existingDiscount = await Discount.findById(id);
    if (!existingDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    const updatedDiscount = await Discount.findByIdAndUpdate(
      id,
      {
        discountId: existingDiscount.discountId,
        name,
        description,
        type,
        value,
        applicablePackages: Array.isArray(applicablePackages) ? applicablePackages : [],
        startDate: start,
        endDate: end,
        property,
      },
      { new: true }
    );

    res.status(200).json({ discount: updatedDiscount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete discount
router.delete('/deleteDiscount/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedDiscount = await Discount.findByIdAndDelete(id);
    if (!deletedDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    res.status(200).json({ discount: deletedDiscount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;