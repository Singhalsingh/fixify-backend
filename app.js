const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');

const GoogleStrategy = require('passport-google-oauth20').Strategy;

require('dotenv').config();

const bookingRoutes = require('./bookingRoutes');
const userRoutes = require('./userRoutes');

const app = express();

const port = process.env.PORT || 5000;


// ==================================
// CORS CONFIGURATION
// ==================================

const allowedOrigins = [

    'http://localhost:5501',
    'http://127.0.0.1:5501',

    'http://localhost:5502',
    'http://127.0.0.1:5502'

];


// Production Frontend URL

if (process.env.FRONTEND_URL) {

    const frontendURL = process.env.FRONTEND_URL.replace(/\/+$/, '');

    allowedOrigins.push(frontendURL);

}


const corsOptions = {

    origin: function (origin, callback) {

        if (!origin || allowedOrigins.includes(origin)) {

            callback(null, true);

        } else {

            console.log('Blocked CORS Origin:', origin);

            callback(new Error('Origin not allowed by CORS'));

        }

    },

    methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS'
    ],

    allowedHeaders: [
        'Content-Type',
        'Authorization'
    ],

    credentials: true

};


// CORS must be before API routes

app.use(cors(corsOptions));


// ==================================
// MIDDLEWARE
// ==================================

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(passport.initialize());


// Request Logger

app.use((req, res, next) => {

    console.log(
        'Incoming Request:',
        req.method,
        req.originalUrl
    );

    next();

});


// ==================================
// GOOGLE PASSPORT CONFIGURATION
// ==================================

if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
) {

    passport.use(

        new GoogleStrategy({

            clientID: process.env.GOOGLE_CLIENT_ID,

            clientSecret: process.env.GOOGLE_CLIENT_SECRET,

            callbackURL:
                process.env.GOOGLE_CALLBACK_URL ||
                'http://localhost:5000/api/users/auth/google/callback'

        },

        function (accessToken, refreshToken, profile, done) {

            return done(null, profile);

        })

    );

} else {

    console.warn(
        'Google OAuth credentials missing in environment variables.'
    );

}


// ==================================
// DATABASE CONNECTION
// ==================================

if (!process.env.MONGODB_URI) {

    console.error('MONGODB_URI is missing!');

} else {

    mongoose.connect(process.env.MONGODB_URI)

        .then(() => {

            console.log('MongoDB Atlas Connected Successfully');

        })

        .catch((error) => {

            console.error(
                'MongoDB Connection Error:',
                error
            );

        });

}
app.use("/api/users", userRoutes);

// ==================================
// TEST ROUTE
// ==================================

app.get('/', (req, res) => {

    res.json({

        success: true,

        message: 'Fixify Backend is Running!'

    });

});


// ==================================
// API ROUTES
// ==================================

app.use('/api/users', userRoutes);

app.use('/api/bookings', bookingRoutes);


// ==================================
// 404 ROUTE
// ==================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: 'API Route Not Found'

    });

});


// ==================================
// SERVER START
// ==================================

app.listen(port, () => {

    console.log(
        `Fixify Server Running on Port ${port}`
    );

});