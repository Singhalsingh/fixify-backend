require("dotenv").config();

const Booking = require("./bookingModel");
const transporter = require("./config/mailer");

// =====================================
// CREATE BOOKING (FAST & NON-BLOCKING)
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

        // Customer ID comes from verified JWT
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

        // 1. Database entry saves instantly
        const savedBooking = await newBooking.save();

        // 2. IMMEDIATE HTTP RESPONSE SEND KAREIN (Non-Blocking Flow)
        // Hum response turant bhej rahe hain taaki frontend par late update na ho
        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking: savedBooking
        });

        // 3. BACKGROUND EMAIL SENDING (No await - running in the background!)
        // Iske background mein chalne se response block nahi hoga
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
