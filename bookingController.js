require('dotenv').config();

const Booking = require('./bookingModel');
const transporter = require('./config/mailer');

// Create a new booking
exports.createBooking = async (req, res) => {
    try {
        const { name, email, service } = req.body;

        // Validate required fields
        if (!name || !email || !service) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and service are required'
            });
        }

        // Save booking in MongoDB
        const newBooking = new Booking(req.body);
        const savedBooking = await newBooking.save();

        let emailSent = false;

        // Send booking confirmation email
        try {
            await transporter.sendMail({
                from: `"Fixify Team" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Booking Confirmation - Fixify',

                text: `Hello ${name}, your booking for ${service} has been received successfully. Thank you for choosing Fixify!`,

                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Hello ${escapeHtml(name)}!</h2>

                        <p>Your booking has been received successfully.</p>

                        <p>
                            <strong>Service:</strong>
                            ${escapeHtml(service)}
                        </p>

                        <p>Thank you for choosing Fixify!</p>

                        <p>Regards,<br>Fixify Team</p>
                    </div>
                `
            });

            emailSent = true;

            console.log(
                'Booking confirmation email sent to:',
                email
            );

        } catch (emailError) {
            console.error(
                'Booking email error:',
                emailError.message
            );
        }

        // Return success response
        return res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            emailSent,
            booking: savedBooking
        });

    } catch (error) {
        console.error('Booking creation error:', error);

        return res.status(400).json({
            success: false,
            message: 'Unable to create booking',
            error: error.message
        });
    }
};


// Get all bookings
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().sort({
            createdAt: -1
        });

        return res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error('Get bookings error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to fetch bookings'
        });
    }
};


// Escape HTML for email content
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}