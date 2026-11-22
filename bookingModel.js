const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        service: {
            type: String,
            required: true
        },

        name: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        date: {
            type: String,
            required: true
        },

        time: {
            type: String,
            required: true
        },

        address: {
            type: String,
            required: true
        },

        notes: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Booking', bookingSchema);