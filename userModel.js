const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: false
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
    },

    resetPasswordToken: {
        type: String,
        default: null
    },

    resetPasswordExpires: {
        type: Date,
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);