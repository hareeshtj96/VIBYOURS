const mongoose = require('mongoose');

const ObjectID = mongoose.Schema.Types.ObjectId;

const orderSchema = new mongoose.Schema({
    user: {
        type: ObjectID,
        ref: 'User',
        required: true,
    },
    orderId: {
        type: String,
        required: true,
    },

    items: [{
        productId: {
            type: ObjectID,
            ref: 'addProduct',
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity can not be less than 1.'],
            default: 1,
        },
        size: {
        type: String, 
        required: true,
    },
        price: {
        type: Number,
        required: true,
    },
    },],
    billTotal: {
    type: Number,
    required: true,
},
    paymentMethod: {
    type: String,
},
    paymentStatus: {
    type: String,
    enum: ['Pending', 'Success', 'Failed', 'Refunded'],
    default: 'Pending',
},
    deliveryAddress: {
    type: {
        name: String,
        houseName: String,
        housename: String,
        street: String,
        pincode: Number,
        city: String,
        state: String,
        country: String,
        locality: String,
        phone: String,
        mobile: String,
        email: String,
        landmark: String,
        addressType: String,
        savedAddress: {
            type: ObjectID,
            ref: 'User',
        },
    },
    required: true,
},
    orderDate: {
    type: Date,
    default: Date.now,
},
    status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Pending'
},
    reason: {
    type: String
},


    requests: [{
        type: {
            type: String,
            enum: ['Cancel', 'Return', '-'],
        },
        status: {
            type: String,
            enum: ['Pending', 'Accepted', 'Rejected'],
            default: 'Pending',
        },
        reason: String,

    },],
    coupon: {
        type: String,
    },
    discountPrice: {
        type: Number,
        default: 0,
    }


},
{
    timestamps: true
        , strictPopulate: false
});

module.exports = mongoose.model('Order', orderSchema);