const Enquiry = require('./enquiryModel');
const transporter = require('./config/mailer');

// Create a new enquiry
exports.createEnquiry = async (req, res) => {
    try {
        const newEnquiry = new Enquiry(req.body);

        // Save enquiry to MongoDB
        const savedEnquiry = await newEnquiry.save();

        const { name, email, service, message } = req.body;

        let customerEmailSent = false;
        let adminEmailSent = false;

        // Send confirmation email to customer
        try {
            await transporter.sendMail({
                from: `"Fixify Team" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Enquiry Received - Fixify',

                text: `Hello ${name || 'Customer'}, we have received your enquiry. Our team will contact you soon.`,

                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Hello ${escapeHtml(name || 'Customer')}!</h2>

                        <p>Thank you for contacting Fixify.</p>

                        <p>We have received your enquiry successfully.</p>

                        <p>
                            <strong>Service:</strong>
                            ${escapeHtml(service || 'General Enquiry')}
                        </p>

                        <p>Our team will contact you soon.</p>

                        <p>Regards,<br>Fixify Team</p>
                    </div>
                `
            });

            customerEmailSent = true;

            console.log('Customer confirmation email sent:', email);

        } catch (emailError) {
            console.error(
                'Customer email error:',
                emailError.message
            );
        }

        // Send enquiry notification to Fixify team
        try {
            if (process.env.EMAIL_USER) {
                await transporter.sendMail({
                    from: `"Fixify Website" <${process.env.EMAIL_USER}>`,
                    to: process.env.EMAIL_USER,
                    subject: 'New Customer Enquiry - Fixify',

                    text: `
                        New enquiry received.

                        Name: ${name || 'Not provided'}
                        Email: ${email || 'Not provided'}
                        Service: ${service || 'Not specified'}
                        Message: ${message || 'No message provided'}
                    `,

                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>New Customer Enquiry</h2>

                            <p><strong>Name:</strong> ${escapeHtml(name || 'Not provided')}</p>
                            <p><strong>Email:</strong> ${escapeHtml(email || 'Not provided')}</p>
                            <p><strong>Service:</strong> ${escapeHtml(service || 'Not specified')}</p>
                            <p><strong>Message:</strong> ${escapeHtml(message || 'No message provided')}</p>
                        </div>
                    `
                });

                adminEmailSent = true;

                console.log('Enquiry notification sent to Fixify team.');
            }

        } catch (emailError) {
            console.error(
                'Admin notification error:',
                emailError.message
            );
        }

        // Return response
        return res.status(201).json({
            success: true,
            message: 'Enquiry created successfully',
            customerEmailSent,
            adminEmailSent,
            enquiry: savedEnquiry
        });

    } catch (error) {
        console.error('Enquiry error:', error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// Get all enquiries
exports.getAllEnquiries = async (req, res) => {
    try {
        const enquiries = await Enquiry.find();

        return res.status(200).json({
            success: true,
            enquiries
        });

    } catch (error) {
        console.error('Get enquiries error:', error.message);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Escape HTML to safely display user-provided text
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}