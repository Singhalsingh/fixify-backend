const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bookingRoutes = require('./bookingRoutes');
require('dotenv').config();
const userRoutes = require('./userRoutes');

// Check for required environment variables
if (!process.env.MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env file.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors({
    origin: [
        "http://127.0.0.1:5501",
        "http://localhost:5501"
    ]
}));

// Parse JSON payloads (IMPORTANT: should be before routes)
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// Passport Google Strategy configuration
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/api/users/auth/google/callback"
      },
      function(accessToken, refreshToken, profile, cb) {
        // Here you would find or create the user in your database
        return cb(null, profile);
      }
    ));
} else {
    console.warn('WARNING: Google OAuth credentials missing in .env file. Google login will not work.');
}

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

app.get('/', (req, res) => {
  res.send('Fixify Backend is Running!');
});

  // Use the user routes
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
console.log('Booking routes registered');

app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.originalUrl);
    next();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});