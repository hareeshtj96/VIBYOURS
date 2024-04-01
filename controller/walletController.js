const Wallet = require("../model/walletModel");
const Order = require("../model/orderModel");
const User = require("../model/userModel");

// wallet
const addToWallet = async(req, res) => {
    try {
        const {amount} = req.body;
       
        const user = await User.findById({_id: req.session.user_id});

        if(!user) {
            return res.status(404).json({ success: false, message: 'User not found'});
        }

        const order = await Order.findOne({ user: user });
        
        if(!order) {
            return res.status(400).json({ success : false, message: 'order not found'});
        }

        let wallet = await Wallet.findOne({ user: user._id });

        if(!wallet) {
            wallet = new Wallet({
                user: user._id,
                balance: 0,
                transactions: []
            })
        }

        const parsedAmount = parseInt(amount);

        wallet.balance += parsedAmount
        wallet.transactions.push ({ amount: parsedAmount, type: 'credit', description: 'Refund for order' + order._id})
        
        await wallet.save();
        
        return res.json({ success: true, message: "Amount refunded successfully"})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message : "Internal Server Error" });
    }
}

module.exports = {
    addToWallet,
}