const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: { // Added password field back
        type: String,
        required: false // Optional for Google Auth users
    },
    phoneNumber: {
        type: String,
        required: false 
    },
    address: {
        type: String,
        required: false 
    },
    bookingDetails: {
        type: String,
        required: false 
    },
    userHistory: {
        type: [String], 
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);