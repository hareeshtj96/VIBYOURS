const User = require("../model/userModel");
const addProduct = require("../model/productModel");
const Wishlist = require("../model/wishlistModel");

//load wishlist page
const loadWishlist = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user_id });
        // console.log("user", user);

        let wishlist = await Wishlist.findOne({ user: user._id }).populate('product');

        if (!wishlist) {
            wishlist = null
        }

        // console.log("wishlist", wishlist);
        // Count the number of products in the wishlist
        const productCount = wishlist ? wishlist.product.length : 0;

        res.render('wishlist', { wishlist, productCount })

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Invalid Server Error" });
    }
}


//add to wishlist
const addWishList = async (req, res) => {
    try {
        const id = req.query.id;

        const user = await User.findOne({ _id: req.session.user_id });

        let wishlist = await Wishlist.findOne({ user: user._id });
        if (!wishlist) {
            wishlist = new Wishlist({
                user: user._id,
                product: [id]
            });
        } else {
            wishlist.product.push(id);
        }

        await wishlist.save();
        res.status(200).send('Product added to wishlist Successfully!');

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Invalid Server Error" });
    }

}


//remove wishlist
const removeWishList = async (req, res) => {
    try {
        const productId = req.query.id;
        const user = await User.findOne({ _id: req.session.user_id })

        if (!user) {
            return res.status(404).send('User not found');
        }

        let wishlist = await Wishlist.findOne({ user: user._id });

        if (!wishlist) {
            return res.status(404).send('Product not found in wishlist')
        }

        const index = wishlist.product.findIndex(item => item._id.toString() === productId);

        if (index === -1) {
            return res.status(404).send('Product not found in wishlist');
        }


        wishlist.product.splice(index, 1);

        await wishlist.save();

        res.status(200).json({ message: 'Product removed from wishlist successfully' });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Invalid Server Error" });
    }
}




module.exports = {
    loadWishlist,
    addWishList,
    removeWishList,
   

}