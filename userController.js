require("dotenv").config();

const { OAuth2Client } = require("google-auth-library");
const User = require("./userModel");
const jwt = require("jsonwebtoken");
const Booking = require("./bookingModel");
const Enquiry = require("./enquiryModel");
const transporter = require("./config/mailer");
const getWelcomeTemplate = require("./template/emailTemplates");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// Safe user response
const safeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber || ""
});


// ======================================
// GET ALL USERS
// ======================================

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select(
            "-password -resetPasswordToken -resetPasswordExpires"
        );

        res.status(200).json(users);

    } catch (error) {
        console.error("Get Users Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch users"
        });
    }
};


// ======================================
// REGISTER USER
// ======================================

exports.createUser = async (req, res) => {
    try {
        const { name, email, phoneNumber, password } = req.body;

        if (!name || !email || !phoneNumber || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            phoneNumber: phoneNumber.trim(),
            password: hashedPassword
        });

        let emailSent = true;

        try {
            await transporter.sendMail({
                from: `"Fixify Team" <${process.env.EMAIL_USER}>`,
                to: normalizedEmail,
                subject: "Welcome to Fixify!",
                html: getWelcomeTemplate(name)
            });

        } catch (emailError) {
            emailSent = false;
            console.error("Welcome Email Error:", emailError);
        }

        return res.status(201).json({
            success: true,
            message: emailSent
                ? "Registration successful. Welcome email sent."
                : "Account created, but welcome email could not be sent.",
            user: safeUser(newUser)
        });

    } catch (error) {
        console.error("Registration Error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};


// ======================================
// LOGIN USER
// ======================================

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        let passwordMatch = false;

        if (user.password.startsWith("$2")) {

            passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

        } else {

            // Support old plain-text passwords
            passwordMatch = user.password === password;

            if (passwordMatch) {
                user.password = await bcrypt.hash(password, 12);
                await user.save();
            }
        }

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: safeUser(user)
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};


// ======================================
// GOOGLE LOGIN / SIGNUP
// ======================================

exports.googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is missing"
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
                message: "Google email verification failed"
            });
        }

        let user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            user = await User.create({
                name,
                email: email.trim().toLowerCase()
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Google login successful",
            token,
            user: safeUser(user)
        });

    } catch (error) {
        console.error("Google Authentication Error:", error);

        return res.status(401).json({
            success: false,
            message: "Google authentication failed"
        });
    }
};


// ======================================
// UPDATE USER PROFILE
// ======================================

// =====================================
// UPDATE PROFILE CONTROLLER
// =====================================
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phoneNumber } = req.body;
        const userId = req.user.id; // From verified JWT

        // Update fields matching Mongo DB Schema
        const updateData = { name, phoneNumber };

        // Agar user ne email bhi bheja hai toh use update data mein shamil karein
        if (email) {
            updateData.email = email;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Return updated safe user details
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phoneNumber: updatedUser.phoneNumber
            }
        });

    } catch (error) {
        console.error("Profile Update Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update profile details"
        });
    }
};


// ======================================
// FORGOT PASSWORD
// ======================================

// ======================================
// FORGOT PASSWORD (SAFE & ROBUST VERSION)
// ======================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        // Generic response to protect privacy
        const responseMessage = "If an account exists with this email, a reset link will be sent.";

        if (!user) {
            return res.status(200).json({
                success: true,
                message: responseMessage
            });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "This account uses Google Login. Please sign in with Google."
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 Mins expiry

        await user.save();

        // Safe fallback logic for FRONTEND_URL if not configured
        const frontendURL = process.env.FRONTEND_URL || "http://localhost:5501"; 

        const resetLink = `${frontendURL}/reset-password.html?token=${resetToken}`;

        try {
            await transporter.sendMail({
                from: `"Fixify Team" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Fixify Password Reset",
                html: `
                    <div style="font-family:Arial;padding:20px;">
                        <h2>Reset Your Password</h2>
                        <p>Hello ${user.name},</p>
                        <p>Click the button below to reset your password.</p>
                        <div style="margin: 20px 0;">
                            <a href="${resetLink}"
                               style="background:#0284c7;color:white;
                               padding:12px 20px;text-decoration:none;
                               border-radius:5px;font-weight:bold;display:inline-block;">
                               Reset Password
                            </a>
                        </div>
                        <p>Or copy this link to your browser: <br>${resetLink}</p>
                        <p>This link will expire in 15 minutes.</p>
                        <p>If you did not request this, please ignore this email.</p>
                    </div>
                `
            });

        } catch (emailError) {
            // Clean token fields if mail fails
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();

            console.error("Nodemailer Error details:", emailError);
            return res.status(500).json({
                success: false,
                message: "Email deliver nahi ho paya. Apna Gmail App Password (EMAIL_PASS) check karein backend par."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Reset link successfully sent to your email!"
        });

    } catch (error) {
        console.error("Forgot Password Main Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to process password reset. Database connectivity check karein."
        });
    }
};


// ======================================
// RESET PASSWORD
// ======================================

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Reset link is invalid or expired"
            });
        }

        user.password = await bcrypt.hash(password, 12);

        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error("Reset Password Error:", error);

        return res.status(500).json({
            success: false,
            message: "Password reset failed"
        });
    }
};


// ======================================
// CREATE BOOKING
// ======================================

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

        return res.status(201).json({
            success: true,
            message: "Booking submitted successfully",
            booking: newBooking
        });

    } catch (error) {
        console.error("Booking Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================
// CREATE ENQUIRY
// ======================================

exports.createEnquiry = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            service,
            message
        } = req.body;

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

        return res.status(201).json({
            success: true,
            message: "Enquiry submitted successfully",
            enquiry
        });

    } catch (error) {
        console.error("Enquiry Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit enquiry"
        });
    }
};