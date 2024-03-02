const express = require("express");
const session = require('express-session');
const flash = require('connect-flash');
const cors = require('cors');
const path = require('path')
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute');
const Swal = require('sweetalert2')
require("./DB/dataBase");
require('dotenv').config();



const app = express();


app.use(flash());

app.use(cors());

//setting view engine
app.set('view engine', 'ejs')
app.set('views', './views/user');


//loading static files
app.use("/static", express.static(path.join(__dirname, "public")))
app.use("/assets", express.static(path.join(__dirname, "public/assets")))
app.use("/adminAssets", express.static(path.join(__dirname, "/public/adminAssets")))
app.use("/uploads", express.static(path.join(__dirname, "/public/uploads")))



// caching disabled for every route
app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
  });

//user Route
app.use('/', userRoute);


//for admin routes
app.use('/admin', adminRoute);



//for handling error page
app.use('*', (req, res) => {
  res.render('error404');
});


const port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log(`server is running  at port ${port}`)
});


