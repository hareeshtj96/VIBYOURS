const Coupon = require("../model/couponModel");
const Cart = require("../model/cartModel");
const User = require("../model/userModel");
const Wishlist = require("../model/wishlistModel");

//coupon in cart
const couponInCart = async (req, res) => {
    try {
        const code = req.query.code;
        const coupon = await Coupon.findOne({ code: code });
        const user = await User.findOne({ _id: req.session.user_id });
        const cart = await Cart.findOne({ owner: user._id });

        if (!coupon) {
            return res.status(404).send("Coupon not found")
        }

        if (!user) {
            return res.status(404).send("User not found");
        }
        if (coupon.maxUsers === 0 || coupon.usersUsed.includes(user._id) || cart.isApplied) {
            return res.status(400).send('Coupon not applicable');
        }

        if (!cart) {
            return res.status(404).send("Cart not found");
        }

        let discountAmount = Math.round(cart.billTotal * (coupon.discountPercentage / 100));
        cart.finalPrice = cart.billTotal - discountAmount;

        cart.finalPrice = Math.round(cart.finalPrice);

        cart.isApplied = true;
        cart.discountPrice = discountAmount;
        cart.coupon = code;

        await cart.save();

        coupon.usersUsed.push(user._id);
        coupon.maxUsers--;
        await coupon.save();

        res.status(200).send('Coupon applied Successfully');
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//remove coupon
const removeCoupon = async (req, res) => {
    try {
        const totalCoupons = await Coupon.find({});

        const user = await User.findOne({ _id: req.session.user_id });

        const coupons = totalCoupons.filter(coupon => coupon.usersUsed.includes(user._id));

        let coupon = coupons[0];
        const userCart = await Cart.findOne({ owner: user._id });

        if(!userCart) {
            return res.status(404).json({ message: "Cart not found"});
        }

        if(!userCart.isApplied || userCart.coupon === 'nil') {
            return res.status(400).json({ message: "No coupon applied to the cart" });
        }


        userCart.isApplied = false;
        userCart.coupon = 'nil';
        userCart.discountPrice = 0;

        userCart.billTotal = userCart.items.reduce((total, item) => total + item.subTotal, 0);


        userCart.finalPrice = userCart.items.reduce((total, item) => total + item.subTotal, 0);


        await userCart.save();

        const userIndex = coupon.usersUsed.indexOf(user._id);

        if (userIndex !== -1) {
            coupon.usersUsed.splice(userIndex, 1)
        }
        coupon.maxUsers++;

        await coupon.save();

        res.status(200).send('Coupon updated Successfully');

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


module.exports = {
    couponInCart,
    removeCoupon
}