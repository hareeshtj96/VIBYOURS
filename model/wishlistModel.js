const mongoose = require('mongoose');

const ObjectID = mongoose.Schema.Types.ObjectId;

const wishlistSchema = new mongoose.Schema({
    user: {
        type: ObjectID,
        ref: 'User',
        required: true
    },
    product: [{
        type: ObjectID,
        ref: 'addProduct'
    }]
})


module.exports = mongoose.model('Wishlist', wishlistSchema);