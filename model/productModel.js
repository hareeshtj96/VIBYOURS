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

    size: [{
        size: { type: String, enum: ['S','M','L','XL']},
        quantity: {type: Number, default: 0}
    }],

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
    }],

    is_listed: {
        type: Number,
        default: 1
    },
    


});

module.exports = mongoose.model('addProduct',productSchema);
