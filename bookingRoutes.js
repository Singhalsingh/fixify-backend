const express = require('express');
const router = express.Router();

const bookingController = require('./bookingController');

console.log('bookingRoutes.js loaded');

router.post('/create-booking', (req, res, next) => {
    console.log('Create booking route matched');
    next();
}, bookingController.createBooking);

router.get('/', bookingController.getAllBookings);

module.exports = router;