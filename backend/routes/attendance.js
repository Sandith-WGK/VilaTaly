const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");

// Mark attendance
router.post("/markAttendance", async (req, res) => {
  try {
    const { employeeId, date, status } = req.body;

    // Check if attendance already marked for the date
    const existingAttendance = await Attendance.findOne({ employeeId, date });
    if (existingAttendance) {
      return res.status(400).json({ message: "Attendance already marked for this date" });
    }

    const attendance = new Attendance({ employeeId, date, status });
    await attendance.save();
    res.status(201).json({ message: "Attendance marked successfully", attendance });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get monthly attendance for an employee
router.get("/monthlyAttendance/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate },
    });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all employees' attendance for a month
router.get("/allEmployeesAttendance", async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;