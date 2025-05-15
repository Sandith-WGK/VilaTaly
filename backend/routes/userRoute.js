const Notification = require('../models/Notification'); // Import the Notification model
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Employee = require('../models/Employee');
const AttendanceRecords = require('../models/attendanceRecords'); // Import the Attendance model


// Function to generate a unique user ID
const generateUserID = async () => {
    let userID;
    let userExists;

    do {
        // Generate a random number and prepend with 'U'
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        userID = `U${randomNum}`;

        // Check if this userID already exists in the database
        userExists = await User.findOne({ userID });

    } while (userExists);

    return userID;
};

// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, username } = req.body;

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Check if the email or username already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email or username already in use' });
        }

        // Generate a unique userID
        const userID = await generateUserID();

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            userID, // Assign the generated userID
            firstName,
            lastName,
            email,
            password: hashedPassword,
            username,
        });

        const savedUser = await newUser.save();

        // Exclude password from the response
        const userResponse = {
            _id: savedUser._id,
            userID: savedUser.userID,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            email: savedUser.email,
            username: savedUser.username,
            userType: savedUser.userType,
            createdAt: savedUser.createdAt,
            updatedAt: savedUser.updatedAt
        };

        res.status(201).json({ message: 'User registered successfully', user: userResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if all required fields are present
        if (!email || !password) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Exclude the password from the response
        const userResponse = {
            _id: user._id,
            userID: user.userID,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            userType: user.userType,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        // Respond with the user object
        res.status(200).json({ message: 'Login successful', user: userResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update User Route

router.put('/updateUser', async (req, res) => {
    try {
        const { userID, firstName, lastName, email, username } = req.body;

        // Update the user details
        const updatedUser = await User.findOneAndUpdate(
            { userID },
            { firstName, lastName, email, username },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If the user is an employee, update the corresponding employee details
        if (updatedUser.userType === "Employee") {
            await Employee.findOneAndUpdate(
                { userID },
                { firstName, lastName, email, username },
                { new: true }
            );

            // Create a notification for the admin
            const notificationMessage = `${firstName} ${lastName} (${username}) updated their details. Please manually verify the changes.`;
            const newNotification = new Notification({
                message: notificationMessage,
            });
            await newNotification.save();
        }

        // Return the updated user data excluding the password
        const userResponse = {
            _id: updatedUser._id,
            userID: updatedUser.userID,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            username: updatedUser.username,
            userType: updatedUser.userType,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        };

        res.status(200).json({ message: 'User updated successfully', user: userResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post("/changeRole", async (req, res) => {
    try {
        const { userID, userType } = req.body;

        if (!userID || !userType) {
            return res.status(400).json({ message: "userID and userType are required" });
        }

        if (!["Admin", "Customer", "Employee"].includes(userType)) {
            return res.status(400).json({ message: "Invalid userType" });
        }

        const user = await User.findOneAndUpdate(
            { userID },
            { userType },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userResponse = {
            _id: user._id,
            userID: user.userID,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            userType: user.userType,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        res.status(200).json({ message: "User role updated successfully", user: userResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/changeRoleAddEmployee", async (req, res) => {
    console.log("changeRoleAddEmployee - Request body:", req.body);
    try {
        const { userID } = req.body;
        if (!userID) {
            return res.status(400).json({ message: "userID is required" });
        }

        const user = await User.findOne({ userID });
        if (!user) {
            return res.status(404).json({ message: `User with userID ${userID} not found` });
        }

        if (user.userType === "Employee") {
            return res.status(400).json({ message: "User is already an Employee" });
        }

        user.userType = "Employee";
        await user.save();
        console.log(`Updated user ${userID} to Employee`);

        res.status(200).json({ message: "User role changed to Employee", user });
    } catch (error) {
        console.error("Error in changeRoleAddEmployee:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Change userType to Customer
router.post("/changeRoleDeleteEmployee", async (req, res) => {
    console.log("changeRoleDeleteEmployee - Request body:", req.body);
    try {
        const { userID } = req.body;
        if (!userID) {
            return res.status(400).json({ message: "userID is required" });
        }

        const user = await User.findOne({ userID });
        if (!user) {
            return res.status(404).json({ message: `User with userID ${userID} not found` });
        }

        if (user.userType === "Customer") {
            return res.status(400).json({ message: "User is already a Customer" });
        }

        user.userType = "Customer";
        await user.save();
        console.log(`Updated user ${userID} to Customer`);

        res.status(200).json({ message: "User role changed to Customer", user });
    } catch (error) {
        console.error("Error in changeRoleDeleteEmployee:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// In-memory store for testing
let inMemoryAttendance = [];

router.post("/markAttendance", async (req, res) => {
    console.log("markAttendance req body:", req.body);
    try {
        const { employeeId, userID, email, date, status } = req.body;

        // Validate request body
        if (!userID || !email || !date || !status) {
            return res.status(400).json({ error: "Missing required fields (userID, email, date, status)" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Validate status
        if (!["Present", "Absent"].includes(status)) {
            return res.status(400).json({ error: "Invalid status. Must be 'Present' or 'Absent'" });
        }

        // Validate date
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        const attendanceRecord = {
            employeeId,
            userID,
            email,
            date: parsedDate,
            status,
        };

        // Save to MongoDB
        const newAttendance = new AttendanceRecords(attendanceRecord);
        await newAttendance.save();
        console.log("MongoDB attendance saved:", newAttendance);

        // In-memory store (for testing, optional)
        inMemoryAttendance.push(attendanceRecord);
        console.log("In-memory attendance updated:", inMemoryAttendance);

        res.status(200).json({ message: "Attendance marked successfully", data: attendanceRecord });
    } catch (err) {
        console.error("Error in markAttendance:", err.message, err.stack);
        res.status(500).json({ error: "Internal server error: " + err.message });
    }
});

//get attendance
router.get("/getAttendance", async (req, res) => {
    try {
        const attendance = await AttendanceRecords.find();
        res.status(200).json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;