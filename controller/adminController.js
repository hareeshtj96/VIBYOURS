const User = require("../model/userModel");
const addProduct = require("../model/productModel");
const addCategory = require("../model/categoryModel")
const Order = require("../model/orderModel");
const Coupon = require("../model/couponModel");
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
        res.status(500).json({ message: "Internal Server Error" });
    }

}



//loading home
const loadHome = async (req, res) => {
    try {

        const totalSales = await Order.aggregate([
            {
                $match: { status: "Delivered" },
            },
            { $group: { _id: null, total: { $sum: "$billTotal" } } },
        ]);

        console.log("totalSales", totalSales)

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const monthlySales = await Order.aggregate([
            {
                $match: {
                    status: "Delivered",
                    orderDate: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$billTotal" },
                },
            },
        ]);

        console.log("monthly sales", monthlySales);

        const orderData = await Order.findOne({ user: req.session.user_id });


        let bestSellingProduct = [];

        const bestSellingProductDetails = await Order.aggregate([
            {
                $match: { status: "Delivered" },
            },
            {
                $unwind: "$items",
            },
            {
                $group: {
                    _id: "$items.productId",
                    sum: { $sum: "$items.quantity" },
                },
            },
            { $sort: { sum: -1 } },
            {
                $group: {
                    _id: null,
                    topSellingProduct: { $push: "$_id" },
                },
            },
            {
                $limit: 10,
            }
        ])

        if (bestSellingProductDetails.length > 0) {
            bestSellingProduct = bestSellingProductDetails[0].topSellingProduct
        }

        const productData = await addProduct.find({
            _id: { $in: bestSellingProduct },
        }).populate("category");

        //top selling category
        const topSellingCategory = await addProduct.aggregate([
            {
                $match: {
                    _id: { $in: bestSellingProduct },
                },
            },
            {
                $group: {
                    _id: "$category",
                    totalQuantity: { $sum: 1 },
                },
            },
            {
                $sort: { totalQuantity: -1 },
            },
            {
                $limit: 5
            },
        ]);

        //top selling brand
        const topSellingBrand = await addProduct.aggregate([
            {
                $match: {
                    _id: { $in: bestSellingProduct },
                },
            },
            {
                $group: {
                    _id: "$brand",
                    totalQuantity: { $sum: 1 },
                },
            },
            {
                $sort: { totalQuantity: -1 },
            },
            {
                $limit: 5
            },
        ]);



        const topCategoryNames = topSellingCategory.map(category => category._id);

        const topCategory = await addCategory.find({ name: { $in: topCategoryNames } });

        res.render('adminHome', { totalSales, monthlySales, topCategory, productData, topBrands: topSellingBrand, orderData });


    } catch (error) {
        console.log("loadHome", error.message);
        res.status(500).json({ message: "Internal Server Error" });
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

        const skip = (page - 1) * pageSize;

        const totalUsers = await User.countDocuments({ is_admin: 0 });

        const totalPages = Math.ceil(totalUsers / pageSize);

        const usersData = await User.find({ is_admin: 0 }).skip(skip).limit(pageSize);
        // console.log(usersData);
        res.render('adminDashboard', { users: usersData, currentPage: page, totalPages: totalPages });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Internal Server Error" });

    }
}


//adding new user
const newUserLoad = async (req, res) => {
    try {
        res.render('new-user');

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });

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
        res.status(500).json({ message: "Internal Server Error" });

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
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//updating users
const updateUsers = async (req, res) => {
    try {
        const userData = await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mobile, is_verified: req.body.verify, is_blocked: req.body.status } });


        res.redirect('/admin/adminDashboard');

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
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
        res.status(500).json({ message: "Internal Server Error" });
    }
}



// Order list
const getOrderList = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const pageSize = 9;

        const skip = (page - 1) * pageSize;

        const totalOrders = await Order.countDocuments({});

        const totalPages = Math.ceil(totalOrders / pageSize);

        const orderData = await Order.find({}).sort({ orderDate: -1 }).skip(skip).limit(pageSize);
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

//admin Coupon
const couponManagement = async (req, res) => {
    try {
        const coupons = await Coupon.find({});
        res.render('adminCoupon', { coupons });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// creating coupon
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            discountPercentage,
            maxDiscountAmount,
            minimumAmount,
            maximumAmount,
            expirationDate,
            maxUsers
        } = req.body;

        console.log(code, description, discountPercentage, maxDiscountAmount, minimumAmount, maximumAmount, maxUsers);

        const coupon = new Coupon({
            code,
            description,
            maxDiscountAmount,
            minimumAmount,
            maximumAmount,
            discountPercentage: discountPercentage,
            expirationDate,
            maxUsers: maxUsers > 0 ? maxUsers : null,
        });
        await coupon.save();
        res.redirect('/admin/couponManagement')
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//list or unlist coupon
const couponListUnlist = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.body.id);

        if (coupon.isActive) {
            await Coupon.findByIdAndUpdate({ _id: req.body.id }, { $set: { isActive: false } });
            await coupon.save();
            res.status(200);
        } else {
            await Coupon.findByIdAndUpdate({ _id: req.body.id }, { $set: { isActive: true } });
            await coupon.save();
            res.status(201);
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "internal Server Error" });
    }
}

// Sales Report
const adminsalesReport = async (req, res) => {
    try {
        const salesReport = await Order.find({ status: { $in: ["Delivered"] } })
            .sort({ orderDate: -1 })
            .populate("user")
            .populate({
                path: 'items.productId',
                select: 'producttitle',
            })
            .lean();

        // console.log("salesReport", salesReport);

        res.render('salesReport', { salesReport });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//sort sales report
const filterSalesReport = async (req, res) => {
    console.log('hi........... it is in filter sales')
    try {
        const { sortBy, date } = req.query;

        let filterData;

        switch (sortBy) {
            case "Day":
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);
                filterData = await Order.find({
                    status: "Delivered",
                    orderDate: { $gte: todayDate, $lte: todayEnd },
                }).populate("user").populate('items.productId');
                break;


            case "Week":
                const startOfWeek = new Date();
                startOfWeek.setHours(0, 0, 0, 0);
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                const endOfWeek = new Date();
                endOfWeek.setHours(23, 59, 59, 999);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                filterData = await Order.find({
                    status: "Delivered",
                    orderDate: { $gte: startOfWeek, $lte: endOfWeek },
                }).populate("user").populate("items.productId")
                break;


            case "Month":
                const startOfMonth = new Date();
                startOfMonth.setHours(0, 0, 0, 0);
                startOfMonth.setDate(1);
                const endOfMonth = new Date(
                    startOfMonth.getFullYear(),
                    startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999
                );
                filterData = await Order.find({
                    status: "Delivered",
                    orderDate: { $gte: startOfMonth, $lte: endOfMonth },
                }).populate("user").populate("items.productId")
                break;


            case "Year":
                const startOfYear = new Date(new Date().getFullYear(), 0, 1);
                const endOfYear = new Date(
                    new Date().getFullYear(),
                    11, 31, 23, 59, 59, 59, 999
                );
                filterData = await Order.find({
                    status: "Delivered",
                    orderDate: { $gte: startOfYear, $lte: endOfYear },
                }).populate("user").populate("items.productId");
                break;


            case "customDate":
                const customDate = new Date(date);
                const nextDay = new Date(customDate);
                nextDay.setDate(customDate.getDate() + 1);
                filterData = await Order.find({
                    status: "Delivered",
                    orderDate: { $gte: customDate, $lte: nextDay },
                }).populate("user").populate("items.productId");
                break;


            default:
                return res.status(400).json({ message: "Invalid paramater" })
        }
        console.log('filter data', filterData);
        res.json({ filterData: filterData });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" })
    }
}


//chart statistics
const chartStatistics = async (req, res) => {
    try {

        let loadOrders = await Order.find({});

        function ordersByDay(orders) {
            const ordersByDay = {
                Sunday: 0,
                Monday: 0,
                Tuesday: 0,
                Wednesday: 0,
                Thursday: 0,
                Friday: 0,
                Saturday: 0,
            };

            orders.forEach((order) => {
                const orderDate = new Date(order.orderDate);
                const dayOfWeek = orderDate.getDay();

                switch (dayOfWeek) {
                    case 0:
                        ordersByDay["Sunday"]++;
                        break;
                    case 1:
                        ordersByDay["Monday"]++;
                        break;
                    case 2:
                        ordersByDay["Tuesday"]++;
                        break;
                    case 3:
                        ordersByDay["Wednesday"]++;
                        break;
                    case 4:
                        ordersByDay["Thursday"]++;
                        break;
                    case 5:
                        ordersByDay["Friday"]++;
                        break;
                    case 6:
                        ordersByDay["Saturday"]++;
                        break;
                    default:
                        break;
                }
            });

            return ordersByDay;
        }

        const countOrdersByDay = ordersByDay(loadOrders);

        console.log("count orders by day", countOrdersByDay);

        function countOrdersByMonth(orders) {
            const monthNames = [
                "January", "February", "March", "April",
                "May", "June", "July", "August",
                "September", "October", "November", "December"
            ];

            const ordersByMonth = {};

            monthNames.forEach(month => {
                ordersByMonth[month] = 0;
            });

            orders.forEach((order) => {
                const orderDate = new Date(order.orderDate);
                const month = orderDate.getMonth();
                ordersByMonth[monthNames[month]]++;
            });

            return ordersByMonth;
        }

        const ordersForYearByMonth = countOrdersByMonth(loadOrders);

        console.log("orders for year by month", ordersForYearByMonth);

        function calculateRevenueByMonth(orders) {
            const monthNames = [
                "January", "February", "March", "April",
                "May", "June", "July", "August",
                "September", "October", "November", "December"
            ];

            const revenueMonthly = {};

            monthNames.forEach(month => {
                revenueMonthly[month] = 0;
            });

            orders.forEach((order) => {
                const orderDate = new Date(order.orderDate);
                const month = orderDate.getMonth();

                if (order.status === "Delivered") {
                    revenueMonthly[monthNames[month]] += order.billTotal;
                }
            });

            return revenueMonthly;
        }

        const revenueForYearByMonth = calculateRevenueByMonth(loadOrders);

        console.log("revenue for year by month", revenueForYearByMonth);

        res.status(200).json({
            dataCurrentWeek: countOrdersByDay,
            dataCurrentYear: ordersForYearByMonth,
            revenueCurrentYear: revenueForYearByMonth,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


//product offers
const productOffers = async(req, res) => {
    try {

        const productData = await addProduct.find({})

        res.render("productOffer", {productData});
        
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//update product offer
const updateProductSellingPrice = async (req, res) => {
    console.log("hi//////");
    try {
        const { productId, sellingPrice } = req.body;

        console.log("Received productId:", productId);
        console.log("Received sellingPrice:", sellingPrice);

        // Validate productId as a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid productId' });
        }

        const updatedProduct = await addProduct.findByIdAndUpdate(productId, { sellingPrice });

        console.log("Updated product:", updatedProduct);

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Selling price updated successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};



//category offer
const categoryOffers = async(req, res) => {
    try {

        const categoryData = await addCategory.find({});

        res.render('categoryOffer', {categoryData});
        
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


//update category offer
const updateCategoryOffer = async(req, res) => {
  
    try {
        const { category, offerPrice } = req.body;

        console.log("request body", req.body)

        const productsToUpdate = await addProduct.find({ category: category});
        if(!productsToUpdate) {
            return res.status(404).json({ message: "Category not found" });

        }

         const offerAmount = parseFloat(offerPrice);
         console.log("offerAmount", offerAmount);

         // Iterate through each product to update sellingPrice
         for (const product of productsToUpdate) {
          
             const productPrice = parseFloat(product.price);

             const newSellingPrice = productPrice - offerAmount;

             console.log("new sellingprice", newSellingPrice);
 
             if (newSellingPrice < product.sellingPrice) {
                 product.sellingPrice = newSellingPrice;
                 await product.save();
             }
         }
        return res.status(200).json({ message: "offer prices updated Successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({message:"Internal Server Error"});
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
    orderStatusChanging,
    couponManagement,
    createCoupon,
    couponListUnlist,
    adminsalesReport,
    filterSalesReport,
    chartStatistics,
    productOffers,
    updateProductSellingPrice,
    categoryOffers,
    updateCategoryOffer

}