const express = require('express');

const session = require('express-session');

const userController = require("../controller/userController");



const user_route = express();




user_route.use(express.urlencoded({ extended:true}));

user_route.set('view engine','ejs')
user_route.set('views','./views/user');

user_route.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, 
}));



const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}))



//route for home page
user_route.get('/',(req,res)=>{
    res.render('home');
});





user_route.get('/register',userController.loadRegister);

user_route.post('/register',userController.insertUser);

user_route.get('/otp',userController.loadOtp);

user_route.post('/otp',userController.getOTP);

user_route.post('/resendotp',userController.resendOTP);

user_route.get('/login',userController.loadLogin);

user_route.post('/login',userController.verifyLogin);

user_route.get('/forgotPassword',userController.loadforgotPassword);

user_route.post('/forgotPassword',userController.forgotPassword);

user_route.get('/resetPassword',userController.loadPasswordReset);

user_route.post('/resetPassword',userController.passwordReset);

user_route.get('/dashboard',userController.loadDashboard);

user_route.get('/home',userController.userLogout);


module.exports = user_route;
