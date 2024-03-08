const User = require("../model/userModel");
const addProduct = require("../model/productModel");
const addCategory = require("../model/categoryModel")
const Order = require("../model/orderModel");
const bcrypt = require("bcrypt");
const randomstring = require('randomstring');
const mongoose = require('mongoose');




//login page rendering
const loadLogin = async (req, res) => {
    // console.log("loadlogin is working")
    try {
        res.render('adminLogin')
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

//verifying login
const verfiyLogin = async (req, res) => {
    // console.log("verify login working")
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);


            if (passwordMatch) {

                if (userData.is_admin === 0) {
                    res.render('adminLogin', { message: "You are not an admin" });

                } else {
                    req.session.user_id = userData._id;
                    res.redirect('/admin/adminHome');
                }
            } else {
                //incorrect password
                res.render('adminLogin', { message: "Email and Password is incorrect" });
            }
        } else {
            //user not found
            res.render('adminLogin', { message: "Email and Password are incorrect" })
        }
    } catch (error) {

        console.log('verify login', error.message);
    }

}

//loading home
const loadHome = async (req, res) => {
    try {
        res.render('adminHome');
    } catch (error) {
        console.log("loadHome", error.message);
    }
}


//admin logout
const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log('logout', error.message);
        res.status(500).send('Internal Server Error');

    }
}

//admin dashboard
const adminDashboard = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const pageSize = 5;

        const skip = (page-1) * pageSize;

        const totalUsers = await User.countDocuments({is_admin: 0});

        const totalPages = Math.ceil(totalUsers/ pageSize);

        const usersData = await User.find({ is_admin: 0 }).skip(skip).limit(pageSize);
        // console.log(usersData);
        res.render('adminDashboard', { users: usersData, currentPage: page, totalPages: totalPages });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Internal Server Error"});

    }
}


//adding new user
const newUserLoad = async (req, res) => {
    try {
        res.render('new-user');

    } catch (error) {
        console.log(error.message);

    }
}

const addUser = async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const mobile = req.body.mobile;
        const password = randomstring.generate(8);

        if (mobile.length !== 10) {
            return res.render('new-user', { message: 'Mobile number must be 10 characters long.' });
        }

        const user = new User({
            name: name,
            email: email,
            mobile: mobile,
            password: password,
            is_admin: 0
        });

        const userData = await user.save();

        if (userData) {
            res.redirect('/admin/adminDashboard');
        } else {
            res.render('new-user', { message: 'Something went wrong' });
        }

    } catch (error) {
        console.log(error.message);

    }
}


//edit user
const editUserLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id })

        if (userData) {
            res.render('edit-user', { user: userData });
        } else {
            res.redirect('/admin/adminDashboard');
        }

    } catch (error) {
        console.log(error.message);
    }
}

//updating users
const updateUsers = async (req, res) => {
    try {
        const userData = await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mobile, is_verified: req.body.verify, is_blocked: req.body.status } });


        res.redirect('/admin/adminDashboard');

    } catch (error) {
        console.log(error.message);
    }
}

//deleting user
const deleteUser = async (req, res) => {
    try {
        const id = req.query.id;
        await User.deleteOne({ _id: id });

        res.redirect('/admin/adminDashboard');
    } catch (error) {
        console.log(error.message);
    }
}



// Order list
const getOrderList = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const pageSize = 9;

        const skip = (page-1) * pageSize;

        const totalOrders = await Order.countDocuments({});

        const totalPages = Math.ceil(totalOrders/pageSize);

        const orderData = await Order.find({}).skip(skip).limit(pageSize);
        // console.log(orderData, "orderData");

        res.render('orderList', { orderData, currentPage: page, totalPages });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}



//order details
const orderDetails = async (req, res) => {

    try {


        const orderId = req.query.orderId;

        // console.log("orderId", orderId);

        // Find the order data
        const orderData = await Order.findOne({ orderId }).populate({
            path: 'items.productId',
            model: 'addProduct',
            select: 'producttitle'
        });

        // console.log("orderData", orderData);

        const userId = req.session.user_id;

        // Find the user data
        const userData = await User.findById({ _id: userId });

        // console.log("userData", userData);

        // Find the product data
        const productData = await addProduct.find({ _id: { $in: orderData.items.map(item => item.product) } });

        // console.log("product", productData);

        // Find the category data
        const categoryIds = productData.map(product => product.categoryId);
        const categoryData = await addCategory.find({ _id: { $in: categoryIds } });

        // console.log("category data", categoryData);

        // Assemble the data
        const assembledOrderData = {
            orderData: orderData,
            userData: userData,
            productData: productData,
            categoryData: categoryData
        };

        // console.log("assembledOrderData", assembledOrderData);

        res.render("orderDetails", assembledOrderData);


    } catch (error) {
        // Handle the error appropriately
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}


//changing orderStatus
const orderStatusChanging = async (req, res) => {
    
    try {
        const { orderId, status } = req.body;

        const changeOrderStatus = await Order.findOneAndUpdate(
            { orderId: orderId },
            { $set: { status: status } },
            { new: true }
        );
        

        if (changeOrderStatus) {
            res.json({ status: "OrderStatusChanged" });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
       
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


module.exports = {
    loadLogin,
    verfiyLogin,
    loadHome,
    logout,
    adminDashboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUsers,
    deleteUser,
    getOrderList,
    orderDetails,
    orderStatusChanging

}