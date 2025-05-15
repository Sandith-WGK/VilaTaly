const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    email: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, required: true },
    employeeId: { type: String }, // Optional, for compatibility with client
});

module.exports = mongoose.model("AttendanceRecodes", attendanceSchema);