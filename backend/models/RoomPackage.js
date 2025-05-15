// models/RoomPackage.js
const mongoose = require('mongoose');

const roomPackageSchema = new mongoose.Schema({
  packageId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true, // e.g., "Deluxe Spa Getaway"
  },
  roomType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomType', // References RoomType model
    required: true,
  },
  basePrice: {
    type: Number,
    required: true, // e.g., 150 (in dollars)
    min: 0,
  },
  capacity: {
    type: Number,
    required: true, // e.g., 2-3 guests
    min: 1,
  },
  features: [{
    type: String, // e.g., ["Free Wi-Fi", "Spa Discount"]
  }],
  image: {
    type: String, // URL or path to image
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

// Pre-save middleware to generate packageId
roomPackageSchema.pre('save', async function(next) {
  try {
    if (!this.packageId) {
      const lastPackage = await this.constructor.findOne({}, {}, { sort: { 'packageId': -1 } });
      let newId = 'PKG-001';
      
      if (lastPackage && lastPackage.packageId) {
        const lastNumber = parseInt(lastPackage.packageId.split('-')[1]);
        newId = `PKG-${String(lastNumber + 1).padStart(3, '0')}`;
      }
      
      this.packageId = newId;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-validate middleware to ensure packageId exists
roomPackageSchema.pre('validate', function(next) {
  if (!this.packageId) {
    this.packageId = 'PKG-001'; // Set a default value for validation
  }
  next();
});

module.exports = mongoose.model('RoomPackage', roomPackageSchema);