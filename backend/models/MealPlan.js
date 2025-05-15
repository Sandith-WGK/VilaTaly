const mongoose = require("mongoose");

const mealPlanSchema = new mongoose.Schema({
  customerID: { type: String, required: true },
  mealPlan: [{
    date: { type: String, required: true },
    breakfast: { type: String, default: null },
    lunch: { type: String, default: null },
    dinner: { type: String, default: null }
  }]
});

const mealPlanModel = mongoose.model("mealPlans", mealPlanSchema);
module.exports = mealPlanModel;