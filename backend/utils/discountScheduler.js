// utils/discountScheduler.js
const Discount = require('../models/Discount');
const cron = require('node-cron');

const setupDiscountScheduler = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const result = await Discount.deleteMany({ 
        endDate: { $lt: now } 
      });
      
      console.log(`Deleted ${result.deletedCount} expired discounts`);
    } catch (error) {
      console.error('Error deleting expired discounts:', error);
    }
  });
};

module.exports = setupDiscountScheduler;