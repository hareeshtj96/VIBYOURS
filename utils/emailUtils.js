// emailUtils.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hareeshtj1996@gmail.com', 
        pass: 'legv losi pjyx irav',    
    },
});

const sendOTPEmail = async (to, otp) => {
    try {
        const mailOptions = {
            from: 'hareeshtj1996@gmail.com',
            to,
            subject: 'Your OTP for Registration',
            text: `Your OTP is: ${otp}`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.response);
        return true;
    } catch (error) {
        console.error('Error sending email: ', error);
        return false;
    }
};

module.exports =  sendOTPEmail;
