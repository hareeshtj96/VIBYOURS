const express = require('express');
const session = require('express-session');
const userController = require("../controller/userController");
const cartController = require("../controller/cartController");
const { isLogin, isLogout } = require("../middleware/userAuth");
const { isBlocked } = require("../middleware/blockAuth");
const bodyParser = require('body-parser');


const user_route = express();

user_route.use(express.urlencoded({ extended: true }));

user_route.set('view engine', 'ejs')
user_route.set('views', './views/user');

user_route.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
}));




user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }))



//**************************USER CONTROLLER ******************************** */

user_route.get('/', isLogout, userController.load_home);

user_route.get('/register', isLogout, userController.loadRegister);

user_route.post('/register', userController.insertUser);

user_route.get('/otp', userController.loadOtp);

user_route.post('/otp', userController.getOTP);

user_route.post('/resendotp', userController.resendOTP);

user_route.get('/login', isLogout, userController.loadLogin);

user_route.post('/login', userController.verifyLogin);

user_route.get('/forgotPassword', userController.loadforgotPassword);

user_route.post('/forgotPassword', userController.forgotPassword);

user_route.get('/resetPassword', userController.loadPasswordReset);

user_route.post('/resetPassword', userController.passwordReset);

user_route.get('/dashboard', isBlocked, isLogin, userController.loadDashboard);

user_route.get('/home', isLogin, userController.userLogout);


//Product actions
user_route.get('/productDetails', userController.listIndividualProduct)


//userProfile actions
user_route.get('/userProfile', userController.userProfile);

user_route.post('/userProfile', userController.postAddress);

user_route.get('/editAddress', userController.getEditAddress)

user_route.post('/editAddress', userController.updateEditAddress);

user_route.get('/deleteAddress', userController.getDeleteAddress);


//cart actions
// user_route.get('/cart', cartController.getCartPage);

user_route.post('/cart', cartController.addToCart);


module.exports = user_route;
