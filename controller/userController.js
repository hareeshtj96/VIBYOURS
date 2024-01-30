const User = require('../model/userModel');
const generateOTP = require('../utils/otpUtils')

const bcrypt = require('bcrypt');





const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash;
    } catch(error) {
        console.log(error.message);
    }

}


//user register
const loadRegister = async (req, res) => {
    try {
        res.render('register')
    } catch (error) {
        console.log('error.message')

    }

}

const insertUser = async (req,res) => {

    try {

        const otp = generateOTP();
        console.log('Generated OTP in insertUser:', otp);

        const  email  = req.body.email;

        //check if the email already exist
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({error: 'Email already registered'});
        }

        // Save OTP and data in session

        req.session.registrationData = {
            name: req.body.name,
            email: email,
            mobile: req.body.mobile,
            password: req.body.password,
            otp: otp,
            is_admin: 0
        };

        res.redirect('/otp')
    } catch (error) {
        console.log(error.message);
    }
}
const loadOtp=async(req,res)=>{
    try {
        res.render('OTP')
    } catch (error) {
        console.log(error.message);
    }
}
//handling otp
const  getOTP = async (req, res) => {
    try {
        const enteredOTP = req.body.otp;
        const storedOTP = req.session.registrationData.otp;
        console.log(req.session.registrationData);
        
        if(enteredOTP==storedOTP){
        const spassword = await securePassword(req.session.registrationData.password)
        const user = new User({
            name : req.session.registrationData.name,
            email: req.session.registrationData.email,
            mobile: req.session.registrationData.mobile,
            password: spassword,
            is_admin: 0,
        });
        const userData = await user.save();

        res.render('login')
        }else{
            res.render('/register',{error: "Incorrect OTP. please try again."});
        }


    } catch (error) {
        console.log(error.message);
        res.render('error', { message: "An error occurred during OTP verification." });
    }
};




//user login
const loadLogin = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    loadRegister,
    insertUser,
    loadLogin,
    loadOtp,
    getOTP

};