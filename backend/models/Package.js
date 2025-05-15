const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
      {
            packageId: {
                  type: String,
                  required: true,
                  unique: true,
            },
            packageImage: {
                  type: String,
                  required: true,
            },
            packageName: {
                  type: String,
                  required: true,
            },
            description: {
                  type: String,
                  required: true,
            },
            size: {
                  type: String,
                  required: true,
            },
            price: {
                  type: Number,
                  required: true,
            },
      },
      { timestamps: true }
);

const packageModel = mongoose.model("packages", packageSchema);
module.exports = packageModel;
