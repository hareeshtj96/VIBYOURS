const express = require('express');
const session = require("express-session");



const admin_route = express();
admin_route.use(express.urlencoded({ extended:true}));



admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');



const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));




const adminController =  require("../controller/adminController");

admin_route.get('/',adminController.loadLogin);

admin_route.post('/',adminController.verfiyLogin);

admin_route.get('/adminDashboard',adminController.loadDashboard);

admin_route.get('/logout',adminController.logout);


module.exports = admin_route;