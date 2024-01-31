const User = require('../model/userModel');
const generateOTP = require('../utils/otpUtils')
const sendOTPEmail = require('../utils/emailUtils');
const { check, validationResult } = require('express-validator');

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

//validating registerForm
// const validateRegistrationForm = [
//     check('name').trim().not().isEmpty().withMessage('Username is required'),
//     check('email').trim().isEmail().withMessage('Invalid email format'),
//     check('mobile').trim().isMobilePhone().withMessage('Invalid mobile number'),
//     check('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
// ];

//     const performRegistrationValidation = (req,res) => {
//         const errors =  validationResult(req);

//         if(!errors.isEmpty()) {
//             return { success: false, errors: errors.array() };
//         }
//     }
//     try {
//         const otp =
//     }


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

        //send OTP via email
        const emailSent = await sendOTPEmail(req.body.email, otp);
        if(emailSent){
            res.redirect('/otp');

        }
        // else {
        //     res.render('error', {message: "Failed to sent OTP via email"});
        // }  
    } catch (error) {
        console.log(error.message);
        res.render('error', { message: "An error occurred during registration." });
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
        
        if(enteredOTP === storedOTP){
        const spassword = await securePassword(req.session.registrationData.password)
        const user = new User({
            name : req.session.registrationData.name,
            email: req.session.registrationData.email,
            mobile: req.session.registrationData.mobile,
            password: spassword,
            is_admin: 0,
        });
        user.is_verified= 1;
        const userData = await user.save();
        res.redirect('/login')

        }else{
            res.render('register',{message: "Incorrect OTP. please try again."});
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


//verify user
const verifyLogin = async (req,res) => {
    try{
        const email = req.session.registrationData.email;
        const password = req.session.registrationData.password;

        const userData = await User.findOne({email:email})

        if(userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if(passwordMatch){
                req.session.user_id = userData._id;
                res.redirect('/dashboard');
            } else {
                res.render('login',{ message: "Incorrect email and password"})
            }

        } else {
            res.render('login',{ message: "Incorrect email and password"})
        }

    } catch (error) {
        console.log(error.message)
    }
}


//dashboard loading
const loadDashboard = async (req, res) => {
    try {

        const userData = await User.findById({ _id: req.session.user_id });
        res.render('dashboard', { user: userData });

    } catch (error) {
        console.log(error.message);

    }
}




module.exports = {
    loadRegister,
    insertUser,
    loadLogin,
    loadOtp,
    getOTP,
    verifyLogin,
    loadDashboard

};