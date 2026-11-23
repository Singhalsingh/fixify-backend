const express = require("express");

const router = express.Router();

const bookingController = require("./bookingController");

// Authentication middleware
const authMiddleware = require("./authMiddleware");

console.log("bookingRoutes.js loaded");

// CREATE BOOKING
router.post(
    "/create-booking",
    authMiddleware,
    bookingController.createBooking
);

// CUSTOMER BOOKINGS
router.get(
    "/my-bookings",
    authMiddleware,
    bookingController.getMyBookings
);

module.exports = router;