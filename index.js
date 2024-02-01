const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/vibyours_ecommerce");


const express = require("express");


const app = express();
const path = require('path')


//loading static files
app.use("/static",express.static(path.join(__dirname,"public")))
app.use("/assets",express.static(path.join(__dirname,"public/assets")))


//user Route
const userRoute = require('./routes/userRoute')
app.use('/',userRoute);


app.listen(7000, function(){
    console.log(`server is running at port 7000`)
});



