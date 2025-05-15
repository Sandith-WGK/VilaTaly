const express = require("express");
const router = express.Router();
const orderModel = require("../models/OrderRoom");
const orderModelT = require("../models/OrderTakeaway"); // Corrected model reference
const MealPlan = require("../models/MealPlan"); // Corrected path for mealPlanModel
const Catering = require("../models/Catering"); // Corrected path for Catering model
const mongoose = require("mongoose");
const moment = require("moment");

// Function to generate a unique order ID
async function generateUniqueOrderId() {
  let unique = false;
  let orderId;

  while (!unique) {
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    orderId = `O${randomNumber}`;
    const existingOrder = await orderModel.findOne({ orderId });
    if (!existingOrder) {
      unique = true;
    }
  }

  return orderId;
}

// Route to get all orders
router.get("/getOrders", async (req, res) => {
  try {
    const orders = await orderModel.find(); // Fetch all orders
    res.json({ orders }); // Wrap the response in an object
  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to get a single order by ID
router.get("/getOrder/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.findOne({ orderId });

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.json(order);
  } catch (err) {
    res.status(500).send(err);
  }
});



router.post("/addOrdertakeaway", async (req, res) => {
    try {
      const {
        customerName,
        customerID,
        phoneNumber,
        address,
        meals,
        orderType,
        totalAmount,
        scheduledDeliveryTime,
      } = req.body;
  
      if (orderType === "takeaway") {
        const slotTime = moment(scheduledDeliveryTime);
  
        // Check if slot is available for takeaway orders
        const existingOrders = await orderModelT.countDocuments({
          scheduledDeliveryTime: slotTime.toDate(),
          orderType: "takeaway"
        });
  
        if (existingOrders >= 5) {
          return res.status(400).json({ message: 'Time slot is fully booked.' });
        }
      }
  
      // Proceed to create the order
      const newOrder = new orderModelT({
        customerName,
        customerID,
        phoneNumber,
        address: orderType === "delivery" ? address : undefined, // Only include address for delivery
        meals,
        orderType,
        totalAmount,
        scheduledDeliveryTime: orderType === "takeaway" ? new Date(scheduledDeliveryTime) : null,
        status: "Pending",
      });
  
      await newOrder.save();
      res.status(201).json(newOrder);
    } catch (err) {
      console.error("Error adding order:", err);
      res.status(500).json({ error: "Internal server error", details: err.message });
    }
  });



// Route to get all orders
router.get("/gettakeawayorders", async (req, res) => {
  try {
    const orders = await orderModelT.find(); // Fetch all orders or use filters as per requirement
    res.json(orders);
  } catch (error) {
    console.error("Failed to retrieve orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/addOrder", async (req, res) => {
  try {
    const {
      purchaseDate,
      customerName,
      customerID,
      amount,
      meals, // This is an array of meal objects
      roomNumber,
      scheduledDeliveryTime, // If scheduling is needed
    } = req.body;

    const orderId = await generateUniqueOrderId();
    const newOrder = new orderModel({
      orderId,
      purchaseDate,
      customerName,
      customerID,
      roomNumber,
      amount,
      meals, // Store the meal objects with customizations and prices
      status: "Pending",
      scheduledDeliveryTime, // Optional: store scheduled time if provided
    });
    
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});


router.post("/updateItem", async (req, res) => {
  try {
    const {
      orderId,
      purchaseDate,
      customerName,
      customerID,
      amount,
      meals,
      status,
    } = req.body;

    const updatedOrder = await orderModel.findOneAndUpdate(
      { orderId },
      { purchaseDate, customerName, customerID, amount, meals, status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send("Order not found");
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/updatetakeawayorder", async (req, res) => {
  try {
    const {
      orderId,
      customerName,
      customerID,
      phoneNumber,
      address,
      meals,
      orderType,
      totalAmount,
      scheduledDeliveryTime,
      status,
    } = req.body;

    const updatedOrder = await orderModelT.findOneAndUpdate(
      { orderId },
      {
        customerName,
        customerID,
        phoneNumber,
        address,
        meals,
        orderType,
        totalAmount,
        scheduledDeliveryTime,
        status,
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send("Order not found");
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/deleteItem", async (req, res) => {
  try {
    const { orderId } = req.body;
    const deletedOrder = await orderModel.findOneAndDelete({ orderId });

    if (!deletedOrder) {
      return res.status(404).send("Order not found");
    }

    res.send("Order deleted successfully");
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/deletetakeawayorder", async (req, res) => {
  try {
    const { orderId } = req.body;
    const deletedOrder = await orderModelT.findOneAndDelete({ orderId });

    if (!deletedOrder) {
      return res.status(404).send("Order not found");
    }

    res.send("Order deleted successfully");
  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to update an order
router.put("/updateOrder/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { purchaseDate, customerName, customerID, amount, meals, status } =
      req.body;

    const updatedOrder = await orderModel.findOneAndUpdate(
      { orderId },
      { purchaseDate, customerName, customerID, amount, meals, status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send("Order not found");
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to update only the status of an order
router.patch("/updateOrderStatus/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const updatedOrder = await orderModel.findOneAndUpdate(
      { orderId },
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send("Order not found");
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to delete an order
router.delete("/deleteOrder/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const deletedOrder = await orderModel.findOneAndDelete({ orderId });

    if (!deletedOrder) {
      return res.status(404).send("Order not found");
    }

    res.send("Order deleted successfully");
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get("/mealPlan/:customerID", async (req, res) => {
  try {
    const { customerID } = req.params;

    // Fetch the customer's meal plan
    const mealPlan = await MealPlan.findOne({ customerID }).lean();
    
    // Fetch all available meals
    const meals = await Catering.find({});

    if (!mealPlan) {
      return res.status(200).json({ mealPlan: [], meals });
    }

    res.status(200).json({ mealPlan: mealPlan.mealPlan, meals });
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Save or update meal plan for a customer
router.post("/mealPlan", async (req, res) => {
  const { customerID, mealPlan } = req.body;

  // Validate that both customerID and mealPlan are provided
  if (!customerID || !mealPlan) {
    return res.status(400).json({ message: "Customer ID and meal plan are required." });
  }

  try {
    // Check if the meal plan already exists for the customer
    const existingMealPlan = await MealPlan.findOne({ customerID }).lean();

    // If the meal plan already exists, check if there are any changes
    if (existingMealPlan && JSON.stringify(existingMealPlan.mealPlan) === JSON.stringify(mealPlan)) {
      return res.status(200).json({ message: "No changes detected in the meal plan." });
    }

    // Use upsert to create or update the meal plan
    const updatedMealPlan = await MealPlan.findOneAndUpdate(
      { customerID },
      { $set: { mealPlan } },
      { new: true, upsert: true, lean: true } // upsert: creates or updates the document
    );

    res.status(200).json({
      message: "Meal plan saved successfully.",
      mealPlan: updatedMealPlan,
    });
  } catch (error) {
    console.error("Error saving meal plan:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


const TIME_SLOTS = [
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '23.59'
  ];
  const MAX_ORDERS_PER_SLOT = 5;
  const SLOT_DURATION_MINUTES = 30;
  
  router.get('/availableTimeSlots', async (req, res) => {
    try {
      const currentDate = moment().startOf('day');
      const endDate = moment().endOf('day');
  
      // Fetch today's takeaway orders
      const currentOrders = await orderModelT.find({
        scheduledDeliveryTime: {
          $gte: currentDate.toDate(),
          $lte: endDate.toDate()
        },
        orderType: 'takeaway',
        status: { $ne: 'cancelled' } // Exclude cancelled orders
      });
  
      // Calculate availability for each time slot
      const timeSlots = TIME_SLOTS.map(timeStr => {
        const slotTime = moment(timeStr, 'HH:mm');
        const slotEndTime = slotTime.clone().add(SLOT_DURATION_MINUTES, 'minutes');
        
        // Check if slot is in the past
        const isPast = slotTime.isBefore(moment());
  
        // Count orders for this time slot
        const ordersInSlot = currentOrders.filter(order => {
          const orderTime = moment(order.scheduledDeliveryTime);
          return orderTime.isSameOrAfter(slotTime) && orderTime.isBefore(slotEndTime);
        }).length;
  
        return {
          time: timeStr,
          availability: isPast ? 0 : Math.max(0, MAX_ORDERS_PER_SLOT - ordersInSlot),
          isPast: isPast
        };
      });
  
      // Add estimated prep time for each slot
      const slotsWithPrepTime = timeSlots.map(slot => ({
        ...slot,
        estimatedPrepTime: calculateEstimatedPrepTime(slot.time, currentOrders)
      }));
  
      res.json(slotsWithPrepTime);
    } catch (error) {
      console.error('Failed to calculate time slots:', error);
      res.status(500).json({ error: 'Failed to fetch time slots' });
    }
  });
  
  function calculateEstimatedPrepTime(slotTime, currentOrders) {
    const slotMoment = moment(slotTime, 'HH:mm');
    const previousSlot = slotMoment.clone().subtract(SLOT_DURATION_MINUTES, 'minutes');
    
    const ordersInPreviousSlot = currentOrders.filter(order => {
      const orderTime = moment(order.scheduledDeliveryTime);
      return orderTime.isSameOrAfter(previousSlot) && orderTime.isBefore(slotMoment);
    }).length;
  
    // Assume each order in the previous slot adds 5 minutes to prep time
    return ordersInPreviousSlot * 5;
  }
  
  

module.exports = router;
