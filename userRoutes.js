const express = require("express");
const router = express.Router();

const userController = require("./userController");
const authMiddleware = require("./authMiddleware");

// Get all users
router.get("/", userController.getAllUsers);

// Manual Registration
router.post("/create", userController.createUser);

// Login
router.post("/login", userController.loginUser);

// Google Login
router.post("/auth/google", userController.googleAuth);

// Update Profile (Protected Route)
// Dono routes rakhne se frontend se PUT aaye ya PATCH, dono handle ho jayenge!
router.put("/profile", authMiddleware, userController.updateProfile);
router.patch("/profile", authMiddleware, userController.updateProfile);


// Forgot Password
router.post(
    "/forgot-password",
    userController.forgotPassword
);

// Reset Password
router.post(
    "/reset-password/:token",
    userController.resetPassword
);

// Booking
router.post("/booking", userController.createBooking);

// Enquiry
router.post("/enquiry", userController.createEnquiry);

module.exports = router;