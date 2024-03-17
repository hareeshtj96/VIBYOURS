const mongoose = require('mongoose');
require('dotenv').config();

const dbUrl = process.env.DB_URL;

const connectDB = mongoose.connect(dbUrl);

connectDB
    .then(() => console.log("Database connected"))
    .catch((err) => console.log(err.message));