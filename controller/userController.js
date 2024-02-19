const User = require('../model/userModel');
const generateOTP = require('../utils/otpUtils')
const sendOTPEmail = require('../utils/emailUtils');
const forgotOTPEmail = require('../utils/forgotOTP');
const addProduct = require("../model/productModel");
const addCategory = require("../model/categoryModel");
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
            is_admin: 0,
            is_blocked: 0,
        };

        //send OTP via email
        const emailSent = await sendOTPEmail(req.body.email, otp);
        if (emailSent) {
            res.redirect('/otp');


        }

    } catch (error) {
        console.log(error.message);
        res.render('error', { message: "An error occurred during registration." });
    }
}

//resend otp
const resendOTP = async (req, res) => {
    try {
        const newOTP = generateOTP();
        console.log("generated new otp:", newOTP);

        req.session.registrationData.otp = newOTP;
        req.session.registrationData.otpTimeout = 60 * 1000;

        //Resend OTP via email
        const emailResent = await sendOTPEmail(req.session.registrationData.email, newOTP)
        if (emailResent) {
            res.redirect('/otp')
        } else {
            res.render('error', { message: "Failed to resent OTP via email" })
        }
    } catch (error) {
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
                is_blocked: 0,
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
                if (userData.is_blocked) {
                    res.render('login', { message: 'Your account is blocked' })

                    req.session.destroy((err) => {
                        if (err) {
                            console.error('Error destroying session:', err);
                        }
                        res.redirect('/');
                    });

                } else {
                    req.session.user_id = userData._id;

                    res.redirect('/dashboard');


                }

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
const forgotPassword = async (req, res) => {
    console.log("forgotPassword is working");
    try {
        const email = req.body.email;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        const otp = generateOTP();

        req.session.forgotPass = {
            email: req.body.email,
            otp: otp
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
const passwordReset = async (req, res) => {
    console.log("password reset working...")
    try {

        const enteredOTP = req.body.otp;
        const storedOTP = req.session.forgotPass.otp;

        //validating new password and confirm new password
        const newPassword = req.body.password;

        //hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const confirmNewpassword = req.body.confirmNewpassword;

        if (newPassword !== confirmNewpassword) {
            return res.status(400).json({ message: 'Both passwords do not match' });

        }

        if (enteredOTP === storedOTP) {
            console.log("successful otp verification")

            const user = await User.findOneAndUpdate(
                { email: req.session.forgotPass.email },
                { password: hashedPassword },
                { new: true },
            );

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            console.log('Email to update:', req.session.forgotPass.email);
            console.log('Hashed password:', hashedPassword);

            res.redirect('/login');


        } else {
            return res.status(400).json({ message: 'Invalid OTP' });
        }


    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });

    }
}


//dashboard loading
const loadDashboard = async (req, res) => {
    try {


        
        const productData = await addProduct.find({}).limit(16);
        const categoryData = await addCategory.find({})

        const userData = await User.findById({ _id: req.session.user_id });
        res.render('dashboard', { user: userData, product: productData, category: categoryData });

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





//load individual product
const listIndividualProduct = async (req, res) => {
    try {

        const id = req.query.id;
        const userData = await User.findById(req.session.user_id)
        const productData = await addProduct.findById({ _id: id })
        const categoryData = await addCategory.find()
        if (productData) {
            res.render('productDetails', { user: userData, product: productData, category: categoryData })
        } else {
            res.redirect('/home');
        }

    } catch (error) {

        console.log(error.message);
    }
}


//loading home page
const load_home = async (req, res) => {
    try {
        const userData = await User.findById(req.session.user_id)
        const productData = await addProduct.find({}).limit(8);
        const categoryData = await addCategory.find({})

        res.render('home', { user: userData, product: productData, category: categoryData });
    } catch (error) {
        console.log(error.message);

    }
}


//load userProfile
const userProfile = async (req, res) => {
    try {
        // console.log(req.session.user_id);

        const userId = req.session.user_id;

        const userData = await User.findById(userId)
        res.render('userProfile', { user: userData });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Servor Error')
    }
}

//updating userProfile
const postAddress = async (req, res) => {
    try {
        const user = req.session.user

        const userData = await User.findOne(user)

        const {
            name,
            mobile,
            pincode,
            housename,
            locality,
            city,
            state,
            landmark,
            addressType
        } = req.body;

        if (!userData) {
            return res.status(404).send('User not found')
        }

        const userAddress = userData.address

        console.log(userAddress);

        if (!userAddress) {
            console.log("hello hii")



            userData.address = [{
                name,
                mobile,
                pincode,
                housename,
                locality,
                city,
                state,
                landmark,
                addressType

            }];
        } else {
            // console.log("hareesh its ")

            userData.address.push({
                name,
                mobile,
                pincode,
                housename,
                locality,
                city,
                state,
                landmark,
                addressType,

            });

        }
        await userData.save();

        res.redirect('/userProfile')

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}


//get editaddress
const getEditAddress = async (req, res) => {
    try {
        const addressId = req.query.addressId;
        const user = req.session.user_id;



        // console.log("Address ID:", addressId);

        const currentAddress = await User.findOne({
            "address._id": addressId,
        });

        // console.log("Current Address:", currentAddress);

        if (!currentAddress) {
            return res.status(404).send('Address not found');
        }

        const addressData = currentAddress.address.find((item) => {
            return item._id.toString() == addressId.toString()
        })
        // console.log(addressData);

        if (!addressData) {
            return res.status(404).send('Address not found');
        }


        // console.log("User Object:", user);

        res.render("editAddress", { address: addressData, user })

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}


//updating editAddress
const updateEditAddress = async (req, res) => {
    try {
        const addressId = req.query.addressId;
        const data = req.body;
        const user = req.session.user_id;

        console.log("Address ID:", addressId);


        const findUser = await User.findOne({ "_id": user });

        console.log("find user result", findUser);

        if (findUser && findUser.address) {
            const matchedAddress = findUser.address.find(item => item._id == addressId);
            console.log("matched Address:", matchedAddress);

            await User.updateOne(
                {
                    "_id": user,
                    "address._id": addressId,
                },
                {
                    $set: {
                        "address.$": {
                            _id: addressId,
                            name: data.name,
                            mobile: data.mobile,
                            pincode: data.pincode,
                            housename: data.housename,
                            locality: data.locality,
                            city: data.city,
                            state: data.state,
                            landmark: data.landmark,
                            addressType: data.addressType,
                        },
                    }
                }
            ).then((result) => {
                console.log("Update Result:", result);
                res.redirect('/userProfile');
            }).catch((error) => {
                console.error("Update Error:", error);
                res.status(500).send('Internal Server Error');
            });
        } else {
            console.log("User not found");
            res.redirect('/userProfile');
        }
    } catch (error) {
        console.error("General Error:", error);
        res.status(500).send('Internal Server Error');
    }
}



//delete address
const getDeleteAddress = async (req, res) => {
    try {
        const addressId = req.query.addressId;

        const user = req.session.user_id;

        const findUser = await User.findOne({ "_id": user });
        await User.updateOne(
            {
                "address._id": addressId
            },
            {

                $pull: {
                    address: {
                        _id: addressId
                    }
                }
            }
        )
            .then((data) => res.redirect('/userProfile'))
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
    userLogout,
    listIndividualProduct,
    load_home,
    userProfile,
    postAddress,
    getEditAddress,
    updateEditAddress,
    getDeleteAddress

};