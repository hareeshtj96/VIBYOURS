const mongoose = require('mongoose');

const ObjectID = mongoose.Schema.Types.ObjectId;

const orderSchema = new mongoose.Schema({
    user: {
        type: ObjectID,
        ref: 'user',
        required: true,
    },
    cart: {
        type: ObjectID,
        ref: 'carts',
    },
    orderId: {
        type: String,
        required: true,
    },

    items: [{
        productId: {
            type: ObjectID,
            ref: 'products',
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
        enum: ['Pending', 'Success', 'Failed'],
        default: 'Pending',
    },
    deliveryAddress: {
        type: {
            name: String,
            houseName: String,
            street: String,
            pincode: Number,
            city: String,
            state: String,
            country: String,
            phone: String,
            email: String
        },
        required: true,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled', 'Returned'],
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


},
    {
        timestamps: true
        , strictPopulate: false
    });

module.exports = mongoose.model('Order', orderSchema);