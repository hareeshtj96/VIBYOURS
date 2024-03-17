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

user_route.post("/register", userController.insertUser);

user_route.get("/otp", userController.loadOtp);

user_route.post("/otp", userController.getOTP);

user_route.post("/resendotp", userController.resendOTP);

user_route.get("/login", isLogout, userController.loadLogin);

user_route.post("/login", userController.verifyLogin);

user_route.get("/forgotPassword", userController.loadforgotPassword);

user_route.post("/forgotPassword", userController.forgotPassword);

user_route.get("/resetPassword", userController.loadPasswordReset);

user_route.post("/resetPassword", userController.passwordReset);

user_route.get("/dashboard", isBlocked, isLogin, userController.loadDashboard);

user_route.get("/home", isLogin, userController.userLogout);

//Product actions
user_route.get("/productDetails", isLogin, userController.listIndividualProduct);

user_route.get("/sortByCaseSensitive", isLogin, userController.sortByCaseSensitive);

user_route.get("/sortByCaseInSensitive", isLogin, userController.sortByCaseInSensitive);

user_route.get("/sortByUserRating", isLogin, userController.sortByRating);

user_route.get("/sortByPopularity", isLogin, userController.sortByPopularity);

user_route.post("/searchProducts", isLogin, userController.searchProducts);

user_route.get("/newArrivals", isLogin, userController.newArrivals);

user_route.get("/lowtoHigh", isLogin, userController.lowToHigh);

user_route.get("/hightoLow", isLogin, userController.hightoLow);

user_route.get("/browseCategory", isLogin, userController.filterCategory);

user_route.post("/userReview", isLogin, userController.userReview);

//userProfile actions
user_route.get("/userProfile", isLogin, userController.userProfile);

user_route.post("/userProfile", isLogin, userController.postAddress);

user_route.get("/editAddress", isLogin, userController.getEditAddress);

user_route.post("/editAddress", isLogin, userController.updateEditAddress);

user_route.get("/deleteAddress", isLogin, userController.getDeleteAddress);

user_route.post('/userprofileResetPassword', isLogin, userController.userprofileResetPassword);

//cart actions
user_route.get("/cart", isLogin, cartController.getCartPage);

user_route.post("/cart", isLogin, cartController.addToCart);

user_route.get("/removeItem", isLogin, cartController.removeItem);

user_route.post("/changingQuantity", isLogin, cartController.changingQuantity);

//checkout Actions
user_route.get("/checkOut", isLogin, cartController.loadCheckOUt);

user_route.post("/checkOut", isLogin, cartController.doCheckOut);

user_route.get("/orderConfirmation", isLogin, cartController.orderConfirmation);

user_route.post("/onlinePayment", cartController.razorpayVerification);

user_route.post("/paypalPayment", cartController.paypalVerification);

user_route.get("/orderDetails", isLogin, cartController.getOrderDetails);

user_route.post("/cancelOrder", isLogin, cartController.cancelOrder);

user_route.post("/returnOrder", isLogin, cartController.returnOrder);

//wishlist Actions
user_route.get("/wishList", isLogin, wishlistController.loadWishlist);

user_route.get("/addToWishlist", isLogin, wishlistController.addWishList);

user_route.get("/removeWishlist", isLogin, wishlistController.removeWishList);



//coupon actions
user_route.get("/applyCouponInCart", isLogin, couponController.couponInCart);

user_route.get("/removeCoupon", isLogin, couponController.removeCoupon);


//wallet actions
user_route.post("/addToWallet", isLogin, walletController.addToWallet);






module.exports = user_route;
