const User = require('../model/userModel');
const generateOTP = require('../utils/otpUtils')
const sendOTPEmail = require('../utils/emailUtils');
const forgotOTPEmail = require('../utils/forgotOTP');
const { generateReferralCode } = require("../utils/referral");
const { pagination } = require("../utils/pagination");
const addProduct = require("../model/productModel");
const addCategory = require("../model/categoryModel");
const Cart = require("../model/cartModel");
const Wishlist = require("../model/wishlistModel");
const Review = require("../model/reviewModel");
const Wallet = require("../model/walletModel");
const Order = require("../model/orderModel");
const bcrypt = require('bcrypt');
const { name } = require('ejs');





const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash;
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }

}




//user register
const loadRegister = async (req, res) => {
    try {
        res.render('register')
    } catch (error) {
        console.log('error.message')
        res.status(500).json({ message: "Internal Server Error" });

    }

}

//insert new user
const insertUser = async (req, res) => {

    try {
        const otp = generateOTP();
        console.log('Generated OTP in insertUser:', otp);

        const { name, email, password, confirmPassword, mobile } = req.body;

        let newTransaction;

        if(password !== confirmPassword) {
            return res.status(400).json({message:"Password not match!"})
        }

        //check if the email already exist
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Save OTP and data in session

        req.session.registrationData = {
            name: name,
            email: email,
            mobile: mobile,
            password: password,
            confirmPassword: confirmPassword,
            otp: otp,
            isAdmin: 0,
            isBlocked: 0,
        };

        
        //send OTP via email
        const emailSent = await sendOTPEmail(req.body.email, otp);
        if (req.body.refCode) {
            const checkingReferral = await User.findOne({ referral: req.body.refCode });
            if (!checkingReferral) {
                return res.render("register", { message: "Invalid referral code" })
            } else {
                const userId = checkingReferral._id;
               
                let wallet = await Wallet.findOne({ user: userId });
                if (!wallet) {
                    wallet = new Wallet({
                        user: userId,
                        balance: 100,
                        transactions: []
                    });
                } else {
                    wallet.balance += 100;
                }
                const newTransaction = {
                    user: userId,
                    amount: 100,
                    type: "Referral",
                    description: `Referral Rewarded by ${name}`
                };
                wallet.transactions.push(newTransaction);
                await wallet.save();
            }
        }
        if (emailSent) {
            res.redirect('/otp');

        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "An error occurred during registration." });
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
        res.status(500).json({ message: "An error occurred during registration." });
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
        res.status(500).json({ message: "Internal Server Error" });
    }
}
//handling otp
const getOTP = async (req, res) => {
    try {
        const enteredOTP = req.body.otp;
        const storedOTP = req.session.registrationData.otp;
       

        if (enteredOTP === storedOTP) {
            const spassword = await securePassword(req.session.registrationData.password)
            const referralCode = generateReferralCode(6);
            const user = new User({
                name: req.session.registrationData.name,
                email: req.session.registrationData.email,
                mobile: req.session.registrationData.mobile,
                password: spassword,
                isAdmin: 0,
                isBlocked: 0,
                referral: referralCode,
            });
            user.isVerified = 1;
            const userData = await user.save();

            // Sweet alert for successful registration
            res.render('register', {
                message: "Registration successful. Please log in to continue.",
                showAlert: true,
                
            });

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

        if(req.session.user_id) {
            res.redirect('/dashboard');
        } else {
            res.render('login');
        }
       
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Internal Server Error" });
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
                if (userData.isBlocked) {
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
        res.status(500).json({ message: "Internal Server Error" });
    }
}




//forgot password page loading
const loadforgotPassword = async (req, res) => {
    try {
        res.render('forgotPassword')

    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// forgot password handling
const forgotPassword = async (req, res) => {
   
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
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// //password reset
const passwordReset = async (req, res) => {
   
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
      
            const user = await User.findOneAndUpdate(
                { email: req.session.forgotPass.email },
                { password: hashedPassword },
                { new: true },
            );

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

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

        //implementing pagination
        const page = parseInt(req.query.page) || 1;
        const pageSize = 9;

        const skip = (page - 1) * pageSize;

        //querying for the total count of products
        const totalProductsCount = await addProduct.countDocuments({ isListed: 1 })

        const productData = await addProduct.find({ isListed: 1 }).skip(skip).limit(pageSize);

        const categoryData = await addCategory.find({})

        const userData = await User.findById({ _id: req.session.user_id });

        let wishlist = await Wishlist.findOne({ user: userData }).populate('product');

        const productCount = wishlist ? wishlist.product.length : 0;

        if (productData.length > 0) {
            const totalPages = Math.ceil(totalProductsCount / pageSize);
            res.render('dashboard', { user: userData, product: productData, category: categoryData, currentPage: page, totalPages: totalPages, productCount });
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });

    }
}



//user logout
const userLogout = async (req, res) => {
    try {

        req.session.destroy();

        res.redirect('/');

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });

    }
}



//load individual product
const listIndividualProduct = async (req, res) => {
    try {

        const id = req.query.id;

        // Validate productId format
        if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
            const err = new Error('Invalid product ID');
            err.status = 404;
            throw err;
        }

        const userData = await User.findById(req.session.user_id)
        const productData = await addProduct.findById(id).where({ isListed: 1 });


        if (!productData) {
            // If productData is null, it means the product with the given ID was not found
            const err = new Error('Product not found');
            err.status = 404;
            throw err;
        }

        let wishlist = await Wishlist.findOne({ user: userData }).populate('product');

        const productCount = wishlist ? wishlist.product.length : 0;


        const categoryData = await addCategory.find({})
        const reviewData = await Review.find({ productId: id }).populate('userId');
    
        if (productData) {
            res.render('productDetails', { user: userData, product: productData, category: categoryData, reviews: reviewData, productCount })
        } else {
            res.redirect('/home');
        }

    } catch (error) {

        console.log(error.message);
        if (error.status === 404) {
            return res.status(404).render('error404');
        } else {
            return res.status(500).json({ message: "Internal Server Error" });

        }

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
        res.status(500).json({ message: "Internal Server Error" });

    }
}


//load userProfile
const userProfile = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = 6;
        const skip = (page - 1) * pageSize;

        let totalPages;

        // Fetch the total count of orders
        const totalOrdersCount = await Order.countDocuments({ user: userId });

        // Fetch a subset of orders based on pagination parameters
        const orderData = await Order.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(pageSize);

        const userData = await User.findById(userId);

        const userCart = await Cart.findOne({ owner: req.session.user_id })

        let wishlist = await Wishlist.findOne({ user: userData }).populate('product');

        const productCount = wishlist ? wishlist.product.length : 0;

        let wallet = await Wallet.findOne({ user: userData._id });

        if (req.query.wallet) {
            const amount = Number(req.query.wallet) / 100;
            if (!wallet) {
                wallet = new Wallet({
                    user: userData._id,
                    balance: 0,
                    transactions: []
                });
            }
            wallet.balance += amount;
            wallet.transactions.push({
                amount: amount,
                type: 'debit',
                description: "Add to Wallet"
            })
            await wallet.save();
        }

        if (!wallet) {
            wallet = {
                transactions: []
            }
        }

        wallet.transactions.sort((a, b) => b.updatedAt - a.updatedAt)

        if (orderData.length > 0) {
            totalPages = Math.ceil(totalOrdersCount / pageSize);

            res.render('userProfile', { user: userData, orderData, currentPage: page, totalPages: totalPages, wallet, productCount, userCart });
        } else {
            // If there are no orders, still render the userProfile page
            res.render('userProfile', { user: userData, orderData, currentPage: page, totalPages: totalPages, wallet, productCount, userCart });
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


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


        if (!userAddress) {
          
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


        let wishlist = await Wishlist.findOne({ user: user._id }).populate('product');

        const productCount = wishlist ? wishlist.product.length : 0;

        const currentAddress = await User.findOne({
            "address._id": addressId,
        });

        if (!currentAddress) {
            return res.status(404).send('Address not found');
        }

        const addressData = currentAddress.address.find((item) => {
            return item._id.toString() == addressId.toString()
        })

        if (!addressData) {
            return res.status(404).send('Address not found');
        }

        res.render("editAddress", { address: addressData, user, productCount })

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

        const findUser = await User.findOne({ "_id": user });

        if (findUser && findUser.address) {
            const matchedAddress = findUser.address.find(item => item._id == addressId);

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
        res.status(500).json({ message: "Internal Server Error" });
    }
}


//user profile reset password
const userprofileResetPassword = async (req, res) => {
    try {
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmNewPassword = req.body.confirmNewPassword;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ success: false, error: 'All fields are required.' });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ success: false, error: 'New password and confirm new password do not match.' });
        }

        // Find the user by comparing hashed passwords
        const user = await User.findOne({});

        if (!user) {
            return res.status(401).json({ success: false, error: "Invalid current Password" });
        }

        // Compare the user's input password with the hashed password from the database
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ success: false, error: "Invalid current Password" });
        }

        // Update the user's password in the database
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = newHashedPassword;
        await user.save();

        // Send a success response
        return res.status(200).json({ success: true, message: 'Password reset successfully.' });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



const sortByProducts = async (req, res) => {
    try {
        const {  sortBy } = req.query;
        let query = {};

        let sortCriteria = {};
        if (sortBy) {
            switch (sortBy) {
                case 'popularity':
                    sortCriteria.count = -1;
                    break;
                case 'rating':
                    sortCriteria.rating = -1;
                    break;
                case 'newArrivals':
                    sortCriteria.createdAt = -1;
                    break;
                case 'lowToHigh':
                    sortCriteria.sellingPrice = 1;
                    break;
                case 'highToLow':
                    sortCriteria.sellingPrice = -1;
                    break;
                case 'aToZ':
                    sortCriteria.productTitle = 1; 
                    break;
                case 'zToA':
                    sortCriteria.productTitle = -1; 
                    break;
                default:
                    // Default sorting criteria
                    sortCriteria.sellingPrice = 1;
                    break;
            }
        } else {
            // Default sorting criteria
            sortCriteria.sellingPrice = 1;
        }

        const products = await addProduct.find().sort(sortCriteria);
        res.json(products);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


//searching products
const searchProducts = async (req, res) => {
    try {
        const { productDetails } = req.body;
        if (productDetails && productDetails.length > 0) {
            const productSearch = await addProduct.find({
                $or: [
                    { productTitle: { $regex: new RegExp(productDetails, 'i') } },
                    { brand: { $regex: new RegExp(productDetails, 'i') } } // Search by brand name
                ]
            });

            if (productSearch && productSearch.length > 0) {
                res.json({ status: true, productSearch });
            } else {
                res.json({ status: false, message: "No matching Products found!" });
            }
        } else {
            res.json({ status: false, message: "No Product found!" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server Error" });
    }
};

//browse Category
const filterCategory = async (req, res) => {
    try {
        const { category } = req.query;
    
        const { skip, page, pageSize, totalPages } = await pagination(req, res);
        const categoryFitler = await addProduct.find({ category });
       
        const categoryData = await addCategory.find({});

        const userData = req.session.user_id;

        let wishlist = await Wishlist.findOne({ user: userData }).populate('product');

        const productCount = wishlist ? wishlist.product.length : 0;

        res.render("categoryFilter", { product: categoryFitler, totalPages, currentPage: page, category: categoryData, productCount })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Invalid Server Error" });
    }
}


// user's product review
const userReview = async (req, res) => {
    try {
        const {
            productId,
            name,
            email,
            rating,
            comment,
        } = req.body;

      
        if (!productId || !rating || !comment || !name || !email) {
            return res.status(400).json({ error: "Invalid request. Please provide all fields" })
        }

        // Save review 
        const newReview = new Review({
            productId,
            userId: req.session.user_id, 
            rating,
            comment,
            userName: name,
            userEmail: email,
        });

        // console.log("newReview", newReview)
        await newReview.save();

        const review = await Review.find({ productId: productId })
        let totalReview = 0;
        review.forEach((rating) => {
            totalReview += rating.rating;
        })

        const productReview = Math.round(totalReview / review.length);

        const ReviewCount = review.length;

        await addProduct.findOneAndUpdate(
            { _id: productId },
            {
                $set: { rating: productReview },
                $inc: { totalReview: ReviewCount }
            },
            { new: true }

        );


        res.status(201).json({ message: "Review submitted successfully" })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}



//sorting category and then filtering
const filterAndSortByCategory = async (req, res) => {
    try {
        const { category, sortBy } = req.query;
      
        let query = {};

        if (category) {
            query.category = category;
        }

        let sortCriteria = {};
        if (sortBy) {
            switch (sortBy) {
                case 'popularity':
                    sortCriteria.count = -1;
                    break;
                case 'rating':
                    sortCriteria.rating = -1;
                    break;
                case 'newArrivals':
                    sortCriteria.createdAt = -1;
                    break;
                case 'lowToHigh':
                    sortCriteria.sellingPrice = 1;
                    break;
                case 'highToLow':
                    sortCriteria.sellingPrice = -1;
                    break;
                case 'aToZ':
                    sortCriteria.productTitle = 1; 
                    break;
                case 'zToA':
                    sortCriteria.productTitle = -1; 
                    break;
                default:
                    // Default sorting criteria
                    sortCriteria.sellingPrice = 1;
                    break;
            }
        } else {
            // Default sorting criteria
            sortCriteria.sellingPrice = 1;
        }

        const products = await addProduct.find(query).sort(sortCriteria);
        res.json(products);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


//user Invoice
const userInvoice = async(req, res) => {
    try {

        const orderId = req.query.orderId;

        const orderData = await Order.findOne({ orderId: orderId }).populate({
            path: "items.productId",
            model: "addProduct",
            select: "productTitle",
          });;

        
        const userCart = await Cart.findOne({ owner: req.session.user_id });


        res.render('userInvoice', {orderData: orderData, userCart});
        
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
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
    getDeleteAddress,
    userprofileResetPassword,
    searchProducts,
    userReview,
    sortByProducts,
    filterCategory,
    filterAndSortByCategory,
    userInvoice

};