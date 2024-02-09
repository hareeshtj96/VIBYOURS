const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/vibyours_ecommerce");

const express = require("express");
const session = require('express-session');



const app = express();
const path = require('path')



//loading static files
app.use("/static",express.static(path.join(__dirname,"public")))
app.use("/assets",express.static(path.join(__dirname,"public/assets")))
app.use("/adminAssets",express.static(path.join(__dirname,"/public/adminAssets")))
app.use("/uploads",express.static(path.join(__dirname,"/public/uploads")))

//user Route
const userRoute = require('./routes/userRoute')
app.use('/',userRoute);


//for admin routes
const adminRoute= require('./routes/adminRoute');
app.use('/admin',adminRoute);


app.listen(7000, function(){
    console.log(`server is running at port 7000`)
});



