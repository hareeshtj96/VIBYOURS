const express = require("express");
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path')
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute');
require("./DB/dataBase");



const app = express();


app.use(flash());

//loading static files
app.use("/static", express.static(path.join(__dirname, "public")))
app.use("/assets", express.static(path.join(__dirname, "public/assets")))
app.use("/adminAssets", express.static(path.join(__dirname, "/public/adminAssets")))
app.use("/uploads", express.static(path.join(__dirname, "/public/uploads")))


//user Route
app.use('/', userRoute);


//for admin routes
app.use('/admin', adminRoute);


app.listen(7000, function () {
    console.log(`server is running at port 7000`)
});


