const User = require('../model/userModel');
const generateOTP = require('../utils/otpUtils')
const sendOTPEmail = require('../utils/emailUtils');
const forgotOTPEmail = require('../utils/forgotOTP');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');


const bcrypt = require('bcrypt');


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;
    } catch (error) {
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

const insertUser = async (req, res) => {

    try {

        const otpTimeout = 30*1000;
        const otp = generateOTP();
        console.log('Generated OTP in insertUser:', otp);

        const email = req.body.email;

        //check if the email already exist
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
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
        if (emailSent) {
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

//resend otp
const resendOTP = async(req,res) => {
    try {
        const newOTP = generateOTP();
        console.log("generated new otp:", newOTP);

        req.session.registrationData.otp = newOTP;
        req.session.registrationData.otpTimeout = 30 * 1000;

        //Resend OTP via email
        const emailResent = await sendOTPEmail(req.session.registrationData.email, newOTP)
        if(emailResent) {
            res.redirect('/otp')
        } else {
            res.render('error', { message: "Failed to resent OTP via email"})
        }
    } catch(error) {
        console.log(error.message);
        res.render('error', { message: "An error occurred while resending OTP." });
    }
}



const loadOtp = async (req, res) => {
    try {

        const currentTime = new Date().getTime();
        const startTime = currentTime - req.session.registrationData.otpTimeout;
        const remainingTime = req.session.registrationData.otpTimeout - (currentTime - startTime);

        // Render OTP page with remaining time
        res.render('OTP', { remainingTime });
        
    } catch (error) {
        console.log(error.message);
    }
}
//handling otp
const getOTP = async (req, res) => {
    try {
        const enteredOTP = req.body.otp;
        const storedOTP = req.session.registrationData.otp;
        console.log(req.session.registrationData);

        if (enteredOTP === storedOTP) {
            const spassword = await securePassword(req.session.registrationData.password)
            const user = new User({
                name: req.session.registrationData.name,
                email: req.session.registrationData.email,
                mobile: req.session.registrationData.mobile,
                password: spassword,
                is_admin: 0,
            });
            user.is_verified = 1;
            const userData = await user.save();
            res.redirect('/login')

        } else {
            res.render('register', { message: "Incorrect OTP. please try again." });
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
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email })

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                req.session.user_id = userData._id;
                res.redirect('/dashboard');
            } else {
                res.render('login', { message: "Incorrect email and password" })
            }

        } else {
            res.render('login', { message: "Incorrect email and password" })
        }

    } catch (error) {
        console.log(error.message)
    }
}


//forgot password page loading
const loadforgotPassword = async (req, res) => {
    try {
        res.render('forgotPassword')
        console.log("it is working")
    } catch (error) {
        console.log(error.message)
    }
}

// forgot password handling
const forgotPassword = async(req,res) => {
    console.log("forgotPassword is working");
    try {
        const email = req.body.email;

        const user = await User.findOne({email});

        if(!user){
            return res.status(404).json({message:'Email not found'});
        }

        const otp = generateOTP();

        req.session.forgotPass = {
            email: req.body.email,
            otp :otp
        }

        const emailSent = await forgotOTPEmail(req.body.email, otp);
        if (emailSent) {
            res.redirect('/resetPassword');

        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
        
    }

    
};

//password reset page loading
const loadPasswordReset = async (req, res) => {
    try {
        res.render('resetPassword')
        // console.log("hi hareesh")
    } catch (error) {
        console.log(error.message)
    }
}

// //password reset
const passwordReset = async(req,res) => {
    console.log("password reset working...")
    try {

        const enteredOTP = req.body.otp;
        const storedOTP = req.session.forgotPass.otp;

        //validating new password and confirm new password
        const newPassword = req.body.password;

        //hash the new password
        const hashedPassword = await bcrypt.hash(newPassword,10);
        const confirmNewpassword = req.body.confirmNewpassword;
        
        if(newPassword!== confirmNewpassword) {
            return res.status(400).json({message: 'Both passwords do not match'});

        }

        if(enteredOTP===storedOTP){
            console.log("successful otp verification")

            const user = await User.findOneAndUpdate(
                {email: req.session.forgotPass.email},
                {password: hashedPassword},
                {new: true},
            );

            if(!user) {
                return res.status(404).json({message: 'User not found'});
            }

            console.log('Email to update:', req.session.forgotPass.email);
            console.log('Hashed password:', hashedPassword);

            res.redirect('/login');


        } else {
            return res.status(400).json({message: 'Invalid OTP'});
        }

        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
        
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

//user logout
const userLogout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/');

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
    resendOTP,
    verifyLogin,
    loadforgotPassword,
    forgotPassword,
    loadPasswordReset,
    passwordReset,
    loadDashboard,
    userLogout

};