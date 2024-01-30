const express = require('express');
const user_route = express();

const session = require('express-session');




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



//route for OTP
user_route.get('OTP', (req, res) => {
    res.render('OTP'); 
});





const userController = require("../controller/userController");

user_route.get('/register',userController.loadRegister);

user_route.post('/register',userController.insertUser);

user_route.get('/login',userController.loadLogin);

user_route.get('/otp',userController.loadOtp)

user_route.post('/otp',userController.getOTP)


module.exports = user_route;
