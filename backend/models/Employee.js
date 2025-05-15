const mongoose = require("mongoose");

module.exports = mongoose.model("employees", new mongoose.Schema({
    imageUrl: { type: String, required: true },
    employeeId: { type: String, required: true },
    userID: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    username: { type: String, required: true },
    leaves: [],
    department: { type: String, default: "General" },
    photoUrl: { type: String, default: "" },
    customerSatisfaction: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    recentAchievement: { type: String, default: "" },
    qrCode: { type: String, required: true },
    lastUpdated: { type: Date, default: null },
    isUpdated: { type: Boolean, default: false }
}, { timestamps: true }));
