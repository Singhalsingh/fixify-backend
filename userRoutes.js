const express = require('express');
const router = express.Router();
const userController = require('./userController'); // Path updated to look in the current directory

// Route to get all users
router.get('/', userController.getAllUsers);

// Route to create a new user (manual registration)
router.post('/create', userController.createUser); // Updated URL path

router.post('/login', userController.loginUser);

// Route for Google authentication
router.post('/auth/google', userController.googleAuth); // Added Google Auth route
router.post('/booking', userController.createBooking);
router.post("/enquiry", userController.createEnquiry);

module.exports = router;