const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  discountId: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    required: true, // e.g., "Off-Season Special"
  },
  description: {
    type: String, // e.g., "20% off all packages in March"
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  value: {
    type: Number,
    required: true, // e.g., 20 (for 20%) or 30 (for $30)
    min: 0,
  },
  applicablePackages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomPackage', // References RoomPackage model, empty means "all"
  }],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

// Pre-save middleware to generate discountId
discountSchema.pre('save', async function(next) {
  try {
    if (!this.discountId) {
      const lastDiscount = await this.constructor.findOne({}, {}, { sort: { 'discountId': -1 } });
      let newId = 'DIS-001';
      
      if (lastDiscount && lastDiscount.discountId) {
        const lastNumber = parseInt(lastDiscount.discountId.split('-')[1]);
        newId = `DIS-${String(lastNumber + 1).padStart(3, '0')}`;
      }
      
      this.discountId = newId;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Discount', discountSchema);