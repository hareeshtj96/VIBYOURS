const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },

    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true
        },
        image: {
            type: String,
            required: true
        },
        subTotal: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity can not be less then 1.'],
            default: 1
        },
        size: {
            type: String,
            required: true
        }
        
    }],

    billTotal: {
        type: Number,
        required: true,
        default: 0
    },
    isApplied: {
        type: Boolean,
        default: false,
    },
    coupon: {
        type: String,
        default: 'nil',
    },
    discountPrice: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Cart', cartSchema);

