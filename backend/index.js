const express = require("express");
require("dotenv").config(); // Load environment variables from .env file
const cors = require("cors");
const cron = require("node-cron"); // Schedule tasks (cron jobs)
const { sendReminderEmail } = require("./utils/emailService"); // Email sending service
const Reminder = require("./models/reminder"); // Reminder model
const Event = require("./models/Event"); // Event model
const app = express();

// Database configuration
const dbConfig = require("./config/db");

// Importing route files
const cateringRoutes = require("./routes/cateringRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const eventRoutes = require("./routes/eventRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const orderRoutes = require("./routes/OrderRoutes");
const packageRoutes = require("./routes/packageRoutes");
const parkingRoutes = require("./routes/parkingRoute");
const userRoutes = require("./routes/userRoute");
const roomRoutes = require("./routes/roomRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const foodRoutes = require("./routes/foodRoutes");
const inventoryRoutes = require("./routes/inventory");
const attendenceRoutes = require("./routes/attendance");
const discountRoutes = require("./routes/discountRoutes");
const notificationRoutes = require("./routes/notificationRoutes"); // Import notification routes
const bookingRoutes = require("./routes/bookingRoutes");
const dailyUsageRoute = require("./routes/dailyUsage"); // Import daily usage route
const path = require("path");
// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Define routes (ensure routes are applied after middleware)
app.use("/api/catering", cateringRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/discount", discountRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/package", packageRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/user", userRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/reminder", reminderRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/attendance", attendenceRoutes);
const setupDiscountScheduler = require('./utils/discountScheduler');
app.use("/api", notificationRoutes); // Mount notification routes
app.use("/api/booking", bookingRoutes);
// Cron job to check reminders every minute
app.use("/api/daily-usage", dailyUsageRoute);

setupDiscountScheduler();

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const reminders = await Reminder.find({
      reminderTime: { $lte: now },
      sentStatus: false,
    });

    for (const reminder of reminders) {
      const event = await Event.findOne({ eventId: reminder.eventId });
      if (event) {
        await sendReminderEmail(reminder.userEmail, event);
        reminder.sentStatus = true;
        await reminder.save();
        console.log(`Reminder email sent to ${reminder.userEmail} for event ${event.eventName}`);
      } else {
        console.log(`Event not found for reminder: ${reminder._id}`);
      }
    }
  } catch (error) {
    console.error("Error sending reminders:", error);
  }
});

// Basic Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    error: "Something went wrong, please try again later.",
  });
});

// Catch all 404 errors
app.use((req, res, next) => {
  res.status(404).send({
    error: "Route not found",
  });
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});