const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({


    productTitle :{
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
    sellingPrice: {
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

    isListed: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    rating: {
        type: Number,
        default: 0,
        max: 5
    },
    totalReview : {
        type: Number,
        default: 0
    },
    count: {
        type: Number,
        default: 0
    },


});

module.exports = mongoose.model('addProduct',productSchema);
