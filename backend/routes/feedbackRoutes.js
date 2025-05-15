    const express = require("express");
    const mongoose = require("mongoose");
    const router = express.Router();
    const feedbackModel = require("../models/Feedback");

    // Retrieve feedback with pagination
    router.post("/getFeedback", async (req, res) => {
    const { page, limit} = req.body;
    try {
        const feedbacks = await feedbackModel
        .find({})
        .skip((page - 1) * limit)
        .limit(limit);
        const total = await feedbackModel.countDocuments();
        res.json({ feedbacks, total });
    } catch (error) {
        res.status(500).json({ message: "Error fetching feedbacks" });
    }
    });


    // Add new feedback
    router.post("/addFeedback", async (req, res) => {
        try {
    
            const { title, username, rating, description, userID } = req.body;
    
            if (!title || !username || rating === undefined || !description || !userID) {
                console.error("Missing required fields");
                return res.status(400).json({ error: "All fields are required" });
            }
    
            const feedback = new feedbackModel({
                title,
                username,
                userID, 
                rating,
                description,
            });
    
            await feedback.save();
            return res.status(201).json({ message: "Feedback added successfully" });
        } catch (error) {
            console.error("Error adding feedback:", error.message);
            return res.status(500).json({ error: "Error adding feedback", details: error.message });
    }
});

    // Update existing feedback
    router.post("/updateFeedback", async (req, res) => {
    const { feedbackID, title, username, rating, description } = req.body;
    try {
        const feedback = await feedbackModel.findById(feedbackID);
        if (!feedback)
        return res.status(404).json({ message: "Feedback not found" });

        feedback.title = title;
        feedback.username = username;
        feedback.rating = rating;
        feedback.description = description;

        await feedback.save();
        res.json({ message: "Feedback updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating feedback" });
    }
    });

    // Delete feedback
    router.post("/deleteFeedback", async (req, res) => {
    const { feedbackID } = req.body;
    try {
        const feedback = await feedbackModel.findById(feedbackID);
        if (!feedback)
        return res.status(404).json({ message: "Feedback not found" });

        await feedback.deleteOne();
        res.json({ message: "Feedback deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting feedback" });
    }
    });

    // Search feedback by title
    router.post("/searchFeedback", async (req, res) => {
        const { search, page, limit } = req.body;
    
        try {
            const searchTerms = search.split(" "); // Split the search input by spaces
    
            // Build the query to search for both title and username
            const query = {
                $or: [
                    { title: { $regex: searchTerms.join("|"), $options: "i" } }, // Match any word in the title
                    { username: { $regex: searchTerms.join("|"), $options: "i" } }, // Match any word in the username
                ],
            };
    
            const feedbacks = await feedbackModel
                .find(query)
                .skip((page - 1) * limit)
                .limit(limit);
    
            const total = await feedbackModel.countDocuments(query);
    
            res.json({ feedbacks, total });
        } catch (error) {
            res.status(500).json({ message: "Error searching feedbacks" });
        }
    });

    // Search feedback by title and filter by userID
    router.post("/getFeedbackByUserId", async (req, res) => {
        const { search, page, limit, userID } = req.body;
        if (!userID) {
            return res.status(400).json({ message: "User ID is required" });
        }
    
        try {
            const searchTerms = search ? search.split(" ") : [];
            const query = {
                userID: userID,
                $or: searchTerms.length > 0 ? [
                    { title: { $regex: searchTerms.join("|"), $options: "i" } },
                    { username: { $regex: searchTerms.join("|"), $options: "i" } },
                ] : [{}]
            };
    
            const feedbacks = await feedbackModel
                .find(query)
                .skip((page - 1) * limit)
                .limit(limit);
    
            const total = await feedbackModel.countDocuments(query);
    
            res.json({ feedbacks, total });
        } catch (error) {
            res.status(500).json({ message: "Error searching feedbacks" });
        }
    });

    router.post("/getFeedback", async (req, res) => {
        const { page, limit } = req.body;
        try {
            const feedbacks = await feedbackModel
                .find({})
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 }); // Latest feedback first
            const total = await feedbackModel.countDocuments();
            res.json({ feedbacks, total });
        } catch (error) {
            res.status(500).json({ message: "Error fetching feedbacks" });
        }
    });
    
    // Get total feedback count
    router.get("/feedbackCount", async (req, res) => {
        try {
            const count = await feedbackModel.countDocuments(); // Get total count of feedbacks
            res.json({ count });
        } catch (error) {
            res.status(500).json({ message: "Error fetching feedback count" });
        }
    });

// Get average feedback ratings by month
router.get("/feedbackRatingsByMonth", async (req, res) => {
    try {
        const feedbacks = await feedbackModel.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" }, // Group by month
                    averageRating: { $avg: "$rating" }, // Calculate average rating
                },
            },
            {
                $sort: { _id: 1 }, // Sort by month
            },
        ]);
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching feedback ratings" });
    }
});

// Get feedback ratings summary (for progress bars)
router.get("/ratingsSummary", async (req, res) => {
    try {
        const feedbackSummary = await feedbackModel.aggregate([
            {
                $group: {
                    _id: "$rating", // Group by rating (1 to 5)
                    count: { $sum: 1 }, // Count how many feedbacks per rating
                },
            },
            {
                $sort: { _id: -1 }, // Sort by rating (5 stars first)
            },
        ]);

        // Calculate the total feedback count
        const totalFeedback = await feedbackModel.countDocuments();
        const averageRating = await feedbackModel.aggregate([
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" },
                },
            },
        ]);

        res.json({
            total: totalFeedback,
            ratings: feedbackSummary,
            average: averageRating.length > 0 ? averageRating[0].avgRating : 0,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching ratings summary" });
    }
});

// Retrieve feedback with pagination
router.post("/getFeedback", async (req, res) => {
    const { page, limit } = req.body;
    try {
        const feedbacks = await feedbackModel
            .find({})
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await feedbackModel.countDocuments();
        res.json({ feedbacks, total });
    } catch (error) {
        res.status(500).json({ message: "Error fetching feedbacks" });
    }
});

/// Like feedback route (protected)
// Like feedback route (protected)
// Like feedback route (protected)
router.post('/:id/like', async (req, res) => {
    const { userID } = req.body;
    
    try {
        console.log("Feedback ID:", req.params.id);
        console.log("User ID:", userID);

        // Validate feedbackID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            
            return res.status(400).json({ message: "Invalid feedback ID" });
        }

        // Find feedback by ID
        const feedback = await feedbackModel.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Here, we're not treating userID as an ObjectId, we're treating it as a regular string
        const userObjectId = userID;  // No need to convert

        // Remove dislike if the user has already disliked
        if (feedback.dislikedBy.includes(userObjectId)) {
            feedback.dislikes -= 1;
            feedback.dislikedBy.pull(userObjectId);
        }

        // Toggle like
        if (feedback.likedBy.includes(userObjectId)) {
            feedback.likes -= 1;
            feedback.likedBy.pull(userObjectId);
        } else {
            feedback.likes += 1;
            feedback.likedBy.push(userObjectId);
        }

        await feedback.save();
        
        return res.status(200).json({ feedback });
    } catch (error) {
        
        return res.status(500).json({ message: 'Error liking feedback', error: error.message });
    }
});

// Dislike feedback route (protected)
router.post('/:id/dislike', async (req, res) => {
    const { userID } = req.body;  // userID is a string

    try {
        // Find the feedback by its ID
        const feedback = await feedbackModel.findById(req.params.id);
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Use userID as a string (no ObjectId conversion needed)
        const userObjectId = userID;

        // Remove like if the user has already liked
        if (feedback.likedBy.includes(userObjectId)) {
            feedback.likes -= 1;
            feedback.likedBy.pull(userObjectId);
        }

        // Toggle dislike
        if (feedback.dislikedBy.includes(userObjectId)) {
            feedback.dislikes -= 1;
            feedback.dislikedBy.pull(userObjectId);
        } else {
            feedback.dislikes += 1;
            feedback.dislikedBy.push(userObjectId);
        }

        // Save the updated feedback
        await feedback.save();
        res.status(200).json({ feedback });
    } catch (error) {
        console.error('Error disliking feedback:', error);
        res.status(500).json({ message: 'Error disliking feedback', error: error.message });
    }
});


    module.exports = router;
