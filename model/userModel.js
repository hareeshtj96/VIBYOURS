const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },

    housename: {
        type: String,
        required: true
    },
    locality: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    landmark: {
        type: String
    },
    addressType: {
        type: String,
        enum: ['home', 'work'],
        required: true
    }
});

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Number,
        required: true
    },
    isVerified: {
        type: Number,
        default: 0
    },
    isBlocked: {
        type: Number,
        default: 0
    },
    referral: {
        type: String
    },
    address: [addressSchema], 
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart'
    }],
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
});

module.exports = mongoose.model('User', userSchema);
