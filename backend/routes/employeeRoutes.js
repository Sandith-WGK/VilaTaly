const express = require('express');
const router = express.Router();
const employeeModel = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Helper function to generate unique employee ID
async function generateUniqueEmployeeId() {
    let unique = false;
    let employeeId;

    while (!unique) {
        const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
        employeeId = `E${randomNumber}`;

        const existingEmployee = await employeeModel.findOne({ employeeId });
        if (!existingEmployee) {
            unique = true;
        }
    }
    return employeeId;
}

// Fetch a single employee by userID
router.get('/getEmployee/:userID', async (req, res) => {
    try {
        const employee = await User.findOne({ userID: req.params.userID });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get('/getEmployeeQRCode/:userID', async (req, res) => {
    try {
        const employee = await employeeModel.findOne({ userID: req.params.userID });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found" });
        }
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Fetch all employees (users with userType === "Employee")
router.get('/getEmployeeNames', async (req, res) => {
    try {
        const employees = await User.find({ userType: "Employee" }, { firstName: 1, lastName: 1, userID: 1, email: 1, username: 1 });
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Fetch all employees (users with userType === "Customer")
router.get('/getCustomerNames', async (req, res) => {
    try {
        const employees = await User.find({ userType: "Customer" }, { firstName: 1, lastName: 1, userID: 1, email: 1, username: 1 });
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Fetch all employees
router.get('/getEmployees', async (req, res) => {
    try {
        const employees = await employeeModel.find();
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

//new get Emp list
router.get('/getEmployeesFor', async (req, res) => {
    try {
        const employees = await employeeModel.find();
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Add new employee
router.post("/addEmployee", async (req, res) => {
    try {
        const {
            userID,
            firstName,
            lastName,
            email,
            username,
            department,
            tasksCompleted,
            recentAchievement,
            imageUrl,
            qrCode,
        } = req.body;

        console.log("addEmployee - Request body:", req.body);

        // Validate required fields
        if (!userID || !firstName || !lastName || !email || !username || !department || tasksCompleted === undefined) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        // Check if user exists and is a Customer
        const user = await User.findOne({ userID });
        if (!user) {
            return res.status(404).json({ message: `User with userID ${userID} not found` });
        }
        if (user.userType === "Employee") {
            return res.status(400).json({ message: "User is already an Employee" });
        }
        if (user.userType !== "Customer") {
            return res.status(400).json({ message: "User must be a Customer to become an Employee" });
        }

        // Check if employee already exists for this user
        const existingEmployee = await employeeModel.findOne({ userID });
        if (existingEmployee) {
            return res.status(400).json({ message: "Employee already exists for this user" });
        }

        // Generate unique Employee ID
        const employeeId = await generateUniqueEmployeeId();

        // Create new employee
        const newEmployee = new employeeModel({
            employeeId,
            userID,
            firstName,
            lastName,
            email,
            username,
            department,
            tasksCompleted,
            recentAchievement,
            imageUrl,
            qrCode,
        });

        await newEmployee.save();

        // Update userType to Employee
        user.userType = "Employee";
        await user.save();
        console.log(`Updated user ${userID} to Employee`);

        res.status(201).json({
            message: "Employee added successfully",
            employee: newEmployee,
        });
    } catch (error) {
        console.error("Error in addEmployee:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Update employee details
router.put('/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { firstName, lastName, email, username, department, imageUrl, tasksCompleted, recentAchievement } = req.body;

        const updatedEmployee = await employeeModel.findOneAndUpdate(
            { employeeId },
            {
                firstName,
                lastName,
                email,
                username,
                department,
                imageUrl,
                tasksCompleted,
                recentAchievement
            },
            { new: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Update the corresponding User document
        await User.findOneAndUpdate(
            { userID: employeeId },
            {
                firstName,
                lastName,
                email,
                username
            }
        );

        res.json(updatedEmployee);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete employee
router.post('/deleteEmployee', async (req, res) => {
    try {
        const { employeeId } = req.body;
        const deletedEmployee = await employeeModel.findOneAndDelete({ employeeId });

        if (!deletedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Delete the corresponding User document
        await User.findOneAndDelete({ userID: employeeId });

        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;