const express = require("express");
const session = require("express-session");
const userController = require("../controller/userController");
const cartController = require("../controller/cartController");
const wishlistController = require("../controller/wishlistController");
const couponController = require("../controller/couponController");
const walletController = require("../controller/walletController");
const { isLogin, isLogout } = require("../middleware/userAuth");
const { isBlocked } = require("../middleware/blockAuth");
const bodyParser = require("body-parser");

const user_route = express();

user_route.use(express.urlencoded({ extended: true }));

user_route.set("view engine", "ejs");
user_route.set("views", "./views/user");

user_route.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

//**************************USER CONTROLLER ******************************** */

user_route.get("/", isLogout, userController.load_home);

user_route.get("/register", isLogout, userController.loadRegister);

user_route.post("/register", isLogout, userController.insertUser);

user_route.get("/otp", isLogout, userController.loadOtp);

user_route.post("/otp", isLogout, userController.getOTP);

user_route.post("/resendotp",isLogout, userController.resendOTP);

user_route.get("/login", isLogout, userController.loadLogin);

user_route.post("/login", isLogout, userController.verifyLogin);

user_route.get("/forgotPassword", isLogout,userController.loadforgotPassword);

user_route.post("/forgotPassword",isLogout, userController.forgotPassword);

user_route.get("/resetPassword",isLogout, userController.loadPasswordReset);

user_route.post("/resetPassword",isLogout, userController.passwordReset);

user_route.get("/dashboard", isBlocked, isLogin, userController.loadDashboard);

user_route.get("/home", isLogin, userController.userLogout);

//Product actions
user_route.get("/productDetails",isBlocked, isLogin, userController.listIndividualProduct);

user_route.post("/searchProducts",isBlocked, isLogin, userController.searchProducts);

user_route.get("/sortByProducts",isBlocked, isLogin, userController.sortByProducts);

user_route.get("/browseCategory",isBlocked, isLogin, userController.filterCategory);

user_route.get("/filterandSortByCategory",isBlocked, isLogin, userController.filterAndSortByCategory);

user_route.post("/userReview",isBlocked, isLogin, userController.userReview);

user_route.get("/userInvoice",isBlocked, isLogin, userController.userInvoice);

//userProfile actions
user_route.get("/userProfile",isBlocked, isLogin, userController.userProfile);

user_route.post("/userProfile",isBlocked, isLogin, userController.postAddress);

user_route.get("/editAddress",isBlocked, isLogin, userController.getEditAddress);

user_route.post("/editAddress",isBlocked, isLogin, userController.updateEditAddress);

user_route.get("/deleteAddress",isBlocked, isLogin, userController.getDeleteAddress);

user_route.post('/userprofileResetPassword', isLogin, userController.userprofileResetPassword);

//cart actions
user_route.get("/cart",isBlocked, isLogin, cartController.getCartPage);

user_route.post("/cart",isBlocked, isLogin, cartController.addToCart);

user_route.get("/removeItem",isBlocked, isLogin, cartController.removeItem);

user_route.post("/changingQuantity",isBlocked, isLogin, cartController.changingQuantity);

//checkout Actions
user_route.get("/checkOut",isBlocked, isLogin, cartController.loadCheckOUt);

user_route.post("/checkOut",isBlocked, isLogin, cartController.doCheckOut);

user_route.get("/orderConfirmation",isBlocked, isLogin, cartController.orderConfirmation);

user_route.post("/onlinePayment",isBlocked, isLogin, cartController.razorpayVerification);

user_route.post("/paypalPayment",isBlocked, isLogin, cartController.paypalVerification);

user_route.post("/failedPayment",isBlocked, isLogin, cartController.paymentFailed);

user_route.post("/retryPayment",isBlocked, isLogin, cartController.retryPayment);

user_route.post("/retryOnlinePayment",isBlocked, isLogin, cartController.paymentVerification);

user_route.get("/orderDetails",isBlocked, isLogin, cartController.getOrderDetails);

user_route.post("/cancelOrder",isBlocked, isLogin, cartController.cancelOrder);

user_route.post("/returnOrder",isBlocked, isLogin, cartController.returnOrder);

//wishlist Actions
user_route.get("/wishList",isBlocked, isLogin, wishlistController.loadWishlist);

user_route.get("/addToWishlist",isBlocked, isLogin, wishlistController.addWishList);

user_route.get("/removeWishlist",isBlocked, isLogin, wishlistController.removeWishList);



//coupon actions
user_route.get("/applyCouponInCart",isBlocked, isLogin, couponController.couponInCart);

user_route.get("/removeCoupon",isBlocked, isLogin, couponController.removeCoupon);


//wallet actions
user_route.post("/addToWallet",isBlocked, isLogin, walletController.addToWallet);






module.exports = user_route;
