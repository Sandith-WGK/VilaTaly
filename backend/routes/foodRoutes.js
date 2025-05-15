const express = require("express");
const { body, param, validationResult } = require("express-validator");
const router = express.Router();
const Food = require("../models/Food");

// Middleware for validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// @desc   Create a new food item
router.post(
    "/",
    [
        body("name").notEmpty().withMessage("Name is required"),
        body("price").isNumeric().withMessage("Price must be a number"),
        body("category").notEmpty().withMessage("Category is required"),
    ],
    validate,
    async (req, res) => {
        try {
            const newFood = new Food(req.body);
            const savedFood = await newFood.save();
            res.status(201).json(savedFood);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// @desc   Get all food items
router.get("/", async (req, res) => {
    try {
        const foods = await Food.find();
        res.status(200).json(foods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @desc   Get single food item by ID
router.get(
    "/:id",
    [param("id").isMongoId().withMessage("Invalid food ID")],
    validate,
    async (req, res) => {
        try {
            const food = await Food.findById(req.params.id);
            if (!food) {
                return res.status(404).json({ message: "Food item not found" });
            }
            res.status(200).json(food);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// @desc   Update food item
router.put(
    "/:id",
    [
        param("id").isMongoId().withMessage("Invalid food ID"),
        body("name").optional().notEmpty().withMessage("Name cannot be empty"),
        body("price").optional().isNumeric().withMessage("Price must be a number"),
        body("category").optional().notEmpty().withMessage("Category cannot be empty"),
    ],
    validate,
    async (req, res) => {
        try {
            const updatedFood = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedFood) {
                return res.status(404).json({ message: "Food item not found" });
            }
            res.status(200).json(updatedFood);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// @desc   Delete food item
router.delete(
    "/:id",
    [param("id").isMongoId().withMessage("Invalid food ID")],
    validate,
    async (req, res) => {
        try {
            const deletedFood = await Food.findByIdAndDelete(req.params.id);
            if (!deletedFood) {
                return res.status(404).json({ message: "Food item not found" });
            }
            res.status(200).json({ message: "Food item deleted successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

module.exports = router;
