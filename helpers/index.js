const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});


exports.sendMail = (toEmail, link) => {
    transporter.sendMail({
        from: process.env.SMTP_USERNAME,
        to: toEmail,
        subject: 'LETTUTOR - Email verification',
        html: `<p>Please click the <a href="${link}">this link</a> to verify your email address, this link will expire in 5 minutes. If you did not request this, please ignore this email. Thank you!</p>`
    }, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log(info);
        }
    });
}