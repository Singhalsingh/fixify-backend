require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service : 'gmail',
    auth : {
        user : process.env.EMAIL_USER,
        pass : process.env.EMAIL_PASS
    },
});

transporter.verify((err, success) => {
    if(err) {
        console.error('Error setting up email transporter : ', err);
    } else {
        console.error("Nodemailer is ready to send mails");
    }
});

module.exports = transporter;