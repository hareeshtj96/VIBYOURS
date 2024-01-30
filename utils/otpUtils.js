// otpUtils.js

//  generateOTP function
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
    
};

// Export the generateOTP function
module.exports = generateOTP;
