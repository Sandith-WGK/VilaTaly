const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

mongoose.set("strictQuery", true);

const mongoURL = process.env.MONGODB_URI;

mongoose
  .connect(mongoURL, {
    dbName: "VilaTest", // ✅ Specify the database name
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((error) => {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1); // Stop the application if connection fails
  });

module.exports = mongoose;