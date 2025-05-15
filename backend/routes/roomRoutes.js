const express = require("express");
const router = express.Router();
const roomsModel = require("../models/Room"); // import model
const ReservationModel = require("../models/Resevation"); // import model
const UserSuggestion = require("../models/userSuggestion"); // import model

// Get all rooms
router.get("/getRooms", async (req, res) => {
      try {
            const rooms = await roomsModel.find();
            res.status(200).json({ rooms });
      } catch (error) {
            res.status(404).json({ message: error.message });
      }
});

//get room by id
router.get("/getRoom/:id", async (req, res) => {
      const { id } = req.params;

      try {
            const room = await roomsModel.findById(id);
            if (!room) {
                  return res.status(404).json({ message: "Room not found" });
            }

            res.status(200).json({ room });
      } catch (error) {
            res.status(404).json({ message: error.message });
      }
});

// Add new room
router.post("/addRoom", async (req, res) => {
      const {
            imageUrl,
            roomNumber,
            roomType,
            bedType,
            size,
            viewInformation,
            facilities,
            price,
            amenities,
            status,
      } = req.body;

      try {
            // Check if a room with the same room number already exists
            const existingRoom = await roomsModel.findOne({ roomNumber });
            if (existingRoom) {
                  return res.status(400).json({
                        message: "Room with this number already exists",
                  });
            }

            // Create a new room if it doesn't exist
            const newRoom = new roomsModel({
                  imageUrl,
                  roomNumber,
                  roomType,
                  bedType,
                  size,
                  viewInformation,
                  facilities,
                  price,
                  amenities,
                  status,
            });
            const room = await newRoom.save();
            res.status(201).json(room);
      } catch (error) {
            res.status(400).json({ message: error.message });
      }
});

//room update
router.put("/updateRoom/:id", async (req, res) => {
      const { id } = req.params; // Room ID
      const { roomNumber } = req.body;

      try {
            // Check if room number already exists in another document
            const existingRoom = await roomsModel.findOne({ roomNumber });
            if (existingRoom && existingRoom._id.toString() !== id) {
                  return res.status(400).json({
                        message: `Room number ${roomNumber} already exists.`,
                  });
            }

            // Find and update the room by ID
            const updatedRoom = await roomsModel.findByIdAndUpdate(
                  id,
                  req.body,
                  { new: true }
            );

            if (!updatedRoom) {
                  return res.status(404).json({ message: "Room not found" });
            }

            res.status(200).json({ room: updatedRoom });
      } catch (error) {
            console.error(error);

            // Handle duplicate key error
            if (error.code === 11000) {
                  const duplicateKey = Object.keys(error.keyValue)[0];
                  const duplicateValue = error.keyValue[duplicateKey];
                  return res.status(400).json({
                        message: `Duplicate key error: ${duplicateKey} with value ${duplicateValue} already exists.`,
                  });
            }

            res.status(500).json({ message: "Server error" });
      }
});

// Route to delete a room
router.delete("/deleteRoom/:id", async (req, res) => {
      const { id } = req.params; // Room ID

      try {
            // Find and delete the room by ID
            const deletedRoom = await roomsModel.findByIdAndDelete(id);

            if (!deletedRoom) {
                  return res.status(404).json({ message: "Room not found" });
            }

            res.status(200).json({ room: deletedRoom });
      } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
      }
});

// Function to generate  booking ID
let currentID = 0; // This should be stored and managed in your database

const generateBookingID = () => {
    currentID++;
    return `Res${currentID.toString().padStart(3, '0')}`;
};

  // Route to create a new room reservation
  router.post("/reserveRoom/:id", async (req, res) => {
      const {
            roomNumber,
          userID,
          guestName,
          guestEmail,
          guestPhone,
          checkInDate,
          checkOutDate,
          packages,
          totalAmount,
      } = req.body;
  
      try {
          // Generate a custom booking ID
          const bookingID = await generateBookingID();
  
          // Create a new reservation with the custom booking ID
          const newReservation = new ReservationModel({
              bookingID, // Add the custom booking ID to the reservation
              userID,
              roomNumber,
              guestName,
              guestEmail,
              guestPhone,
              checkInDate,
              checkOutDate,
              packages,
              totalAmount,
          });
  
          // Save the reservation to the database
          await newReservation.save();
  
          res.status(201).json({ reservation: newReservation });
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: "Server error" });
      }
  });
  

router.get("/getBookings", async (req, res) => {
      try {
            const bookings = await ReservationModel.find();
            res.status(200).json({ bookings });
      } catch (error) {
            res.status(404).json({ message: error.message });
      }
});

//update booking
router.put("/updateBooking/:id", async (req, res) => {
      try {
          const updatedBooking = await ReservationModel.findByIdAndUpdate(
              req.params.id,
              req.body,
              { new: true }
          );
          res.status(200).json(updatedBooking);
      } catch (error) {
          res.status(404).json({ message: error.message });
      }
  });

  //delete bookings
  router.delete("/deleteBooking/:id", async (req, res) => {
      try {
          await ReservationModel.findByIdAndDelete(req.params.id);
          res.status(200).json({ message: "Booking deleted successfully" });
      } catch (error) {
          res.status(404).json({ message: error.message });
      }
  });

  // Route to fetch best-selling rooms (based on booking count or some other logic)
router.get('/getBestSelling', async (req, res) => {
      try {
          // Assuming "best-selling" is based on the number of reservations
          const bestSellingRooms = await ReservationModel.aggregate([
              { $group: { _id: "$roomNumber", count: { $sum: 1 } } },
              { $sort: { count: -1 } }, // Sort by highest booking count
              { $limit: 5 } // Limit to top 5 rooms
          ]);
  
          // Find room details for the best-selling rooms
          const roomIds = bestSellingRooms.map(room => room._id);
          const rooms = await roomsModel.find({ roomNumber: { $in: roomIds } });
  
          res.status(200).json({ rooms });
      } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Error fetching best-selling rooms' });
      }
  });

// Route to get user-specific recommendations based on user behavior
router.get('/getRecommendations', async (req, res) => {
      const { userId } = req.query;
    
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
    
      try {
        // Fetch user suggestions based on user ID
        const userSuggestion = await UserSuggestion.findOne({ userId });
    
        if (!userSuggestion || userSuggestion.rooms.length === 0) {
          return res.status(200).json({ recommendations: [] });
        }
    
        // Find room details for the suggested rooms using _id instead of roomNumber
        const rooms = await roomsModel.find({ _id: { $in: userSuggestion.rooms } });
    
        res.status(200).json({ recommendations: rooms });
      } catch (error) {
        console.error('Error fetching user recommendations:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });    

// Route to save user room suggestion
router.post('/saveSuggestion', async (req, res) => {
      const { userId, roomId } = req.body;
    
      if (!userId || !roomId) {
        return res.status(400).json({ message: 'User ID and Room ID are required' });
      }
    
      try {
        let userSuggestion = await UserSuggestion.findOne({ userId });
    
        if (userSuggestion) {
          // Add the room to suggestions if not already present
          if (!userSuggestion.rooms.includes(roomId)) {
            userSuggestion.rooms.push(roomId);
          }
        } else {
          // Create a new suggestion if none exist for this user
          userSuggestion = new UserSuggestion({
            userId,
            rooms: [roomId],
          });
        }
    
        await userSuggestion.save();
        res.status(201).json({ message: 'Suggestion saved successfully' });
      } catch (error) {
        console.error('Error saving user suggestion:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });
  
module.exports = router;
