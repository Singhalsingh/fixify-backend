const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

const User = require('./userModel'); // Importing the updated User model
const jwt = require('jsonwebtoken');
const Booking = require('./bookingModel');
const Enquiry = require("./enquiryModel");
const transporter = require("./config/mailer");
const getWelcomeTemplate = require("./template/emailTemplates");
require('dotenv').config();

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if(!user) {
            console.log("User not found!");
            return res.status(404).json({
                success : false,
                message : "User not found!"
            })
        }

        const passwordMatch = user.password === password; 
        
        if(!passwordMatch) {
            console.log("Incorrect credentials!");
            return res.status(401).json({
                success : false,
                message : "Incorrect credentials!"
            })
        }

        return res.status(200).json({
            success : true,
            message : "Logged in successfully",
            user : user
        });
    } catch(e) {
        console.error("Error while logging in user : ", e);
        res.status(500).json({
            success : false,
            message : "Internal Server Error"
        })
    }
}


// Create a new user with manual registration details
exports.createUser = async (req, res) => {
    const { name, email, phoneNumber, password } = req.body;

    let newUser;

    // Step 1: Save the user to the database
    try {
        const user = new User({
            name,
            email,
            phoneNumber, 
            password // IMPORTANT: Hash it in production
        });

        newUser = await user.save();
        if(!newUser) {
            console.error('Failed to create new user in DB');
            return res.status(500).json({ success: false, message: 'Failed to create user' });
        }
        console.log('New user successfully created in DB:', newUser.email);
    } catch (error) {
        console.error('Database Error:', error.message);
        // ADD 'return' HERE to stop the execution if database save fails
        return res.status(400).json({ success: false, message: error.message });
    }

    // Step 2: Try sending the welcome email ONLY if step 1 succeeded
    try {
        const info = await transporter.sendMail({
            from : `"Fixify Team" <${process.env.EMAIL_USER}>`,
            to : email,
            subject : "Onboarding with Fixify! 🚀",
            html : getWelcomeTemplate(name),
        });

        console.log('Nodemailer response info:', info);

        // Send a single combined success response back to the client
        return res.status(201).json({
            success : true,
            message : "User registered and onboarding mail sent successfully!",
            newUser : newUser,
        });
    } catch (emailError) {
        console.error("Nodemailer failed to deliver email : ", emailError);
        
        // Return 201 because the user account WAS created, but mention the mail failed
        return res.status(201).json({
            success : true,
            message : "Account created successfully, but welcome email failed to send.",
            newUser : newUser,
            emailError: emailError.message
        });
    }
};



// Handle Google Login / Sign up
exports.googleAuth = async (req, res) => {

    try {

        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is missing."
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        const { email, name, email_verified } = payload;

        if (!email || !email_verified) {
            return res.status(401).json({
                success: false,
                message: "Google email verification failed."
            });
        }

        let user = await User.findOne({ email });

        if (!user) {

            user = new User({
                name,
                email
            });

            await user.save();

        }

        return res.status(200).json({
            success: true,
            message: "Google Login Successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    }

    catch (error) {

        console.error("Google Authentication Error:", error);

        return res.status(401).json({
            success: false,
            message: "Google authentication failed."
        });

    }

};


// Create a new booking
exports.createBooking = async (req, res) => {

    try {

        const {
            service,
            name,
            phone,
            date,
            time,
            address,
            notes
        } = req.body;

        const booking = new Booking({
            service,
            name,
            phone,
            date,
            time,
            address,
            notes
        });

        const newBooking = await booking.save();

        console.log("New booking created:", newBooking);

        res.status(201).json({
            success: true,
            message: "Booking submitted successfully",
            booking: newBooking
        });

    } catch (error) {

        console.error("Booking error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.createEnquiry = async (req, res) => {
  try {
    const { name,
         email,
          phone,
         service, 
         message 
        }= req.body;

    if (!name || !email || !phone || !service || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const enquiry = new Enquiry({
      name,
      email,
      phone,
      service,
      message
    });

    await enquiry.save();

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      enquiry
    });

  } catch (error) {
    console.error("Enquiry Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit enquiry"
    });
  }
};