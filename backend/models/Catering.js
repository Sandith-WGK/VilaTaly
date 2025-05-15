const mongoose = require("mongoose");

const cateringSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    itemId: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["vegi", "non vegi"],
      required: true,
    },
    category: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
    },
  },
  { timestamps: true }
);

const cateringModel = mongoose.model("caterings", cateringSchema);
module.exports = cateringModel;