const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({


    producttitle :{
        type: String,
        required: true,

    },

    description: {
        type: String,
        required:true
    },

    brand: {
        type: String,
        required: true
    },

    size: {
        type: String,
        required: true,
    },

    price: {
        type: Number,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    images: [{
        type:String
    }]
    


});

module.exports = mongoose.model('addProduct',productSchema);
