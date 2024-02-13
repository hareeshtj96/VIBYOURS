const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({

    name:{
        type :String,
        required: true,
    },

    description:{
        type: String,
        required: true,
    },

    is_blocked:{
        type: Number,
        default: 0,
    }

});

module.exports = mongoose.model('addCategory',categorySchema);