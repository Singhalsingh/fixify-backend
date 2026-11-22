require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
});

if (process.env.NODE_ENV !== 'production') {
    transporter.verify((err) => {
        if (err) {
            console.error('Error setting up email transporter:', err.message);
        } else {
            console.log('Nodemailer is ready to send mails');
        }
    });
}

module.exports = transporter;