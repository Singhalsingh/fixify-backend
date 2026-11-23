require("dotenv").config();

const Booking = require("./bookingModel");
const transporter = require("./config/mailer");

// =====================================
// CREATE BOOKING (FAST, SECURE & NON-BLOCKING)
// =====================================

exports.createBooking = async (req, res) => {

    try {
        const {
            name,
            email,
            service,
            phone,
            date,
            time,
            address,
            notes
        } = req.body;

        // 1. Validate required fields
        if (
            !name ||
            !email ||
            !service ||
            !phone ||
            !date ||
            !time ||
            !address
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });
        }

        // 2. STRICT PAST DATE SECURITY VALIDATION (Backend Level)
        // Aaj ki local date (YYYY-MM-DD format) nikalte hain user ki timezone ke mutabik
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`; // Format: YYYY-MM-DD

        // Agar select ki gayi date aaj ke din se pehle ki hai
        if (date < todayString) {
            return res.status(400).json({
                success: false,
                message: "You cannot book a service for a past date! Please select today or a future date."
            });
        }

        // 3. Customer ID comes from verified JWT
        const newBooking = new Booking({
            userId: req.user.id,
            name,
            phone,
            service,
            date,
            time,
            address,
            notes: notes || ""
        });

        // 4. Database entry saves instantly
        const savedBooking = await newBooking.save();

        // 5. IMMEDIATE HTTP RESPONSE SEND KAREIN (Instant Action Response)
        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking: savedBooking
        });

        // 6. BACKGROUND EMAIL SENDING (Non-Blocking - running in background without await!)
        transporter.sendMail({
            from: `"Fixify Team" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Booking Confirmation - Fixify",
            text: `Hello ${name}, your booking for ${service} has been received successfully.`,
            html: `
                <div style="font-family:Arial;padding:20px">
                    <h2>Hello ${escapeHtml(name)}!</h2>
                    <p>Your booking has been received successfully.</p>
                    <p>
                        <strong>Service:</strong>
                        ${escapeHtml(service)}
                    </p>
                    <p>
                        <strong>Date:</strong>
                        ${escapeHtml(date)}
                    </p>
                    <p>
                        <strong>Time:</strong>
                        ${escapeHtml(time)}
                    </p>
                    <p>Thank you for choosing Fixify!</p>
                    <p>Regards,<br>Fixify Team</p>
                </div>
            `
        })
        .then(() => {
            console.log(`Booking confirmation email sent to ${email} successfully.`);
        })
        .catch((emailError) => {
            console.error("Background Booking Email Delivery Failed:", emailError.message);
        });

    } catch (error) {
        console.error("Booking Error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to create booking"
        });
    }
};

// =====================================
// GET LOGGED-IN CUSTOMER BOOKINGS
// =====================================

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            userId: req.user.id
        }).sort({
            createdAt: -1
        });

        return res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error(
            "Customer Booking Fetch Error:",
            error.message
        );
        return res.status(500).json({
            success: false,
            message: "Unable to fetch your bookings"
        });
    }
};

// =====================================
// ESCAPE HTML
// =====================================

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}
