const Razorpay = require("razorpay");


// Define your test keys
const key_id = 'rzp_test_NGuzvYo6A3U204';
const key_secret = 'NOgcQagQuA0Ag5ff05a7Gxxw';


// test keys
const instance = new Razorpay({
    key_id: key_id,
    key_secret: key_secret,

})

//function to integrate razorpay
function razorpayIntegration(orderId, amount) {
    return new Promise((resolve, reject)=> {
        var options = {
            amount: amount,
            currency: "INR",
            receipt: orderId
        };
        instance.orders.create(options, function(err, order){
            if(err) {
                console.error('Error creating Razorpay order:', err);
                reject(err);
                return;
            }
            resolve(order);
        });
        
    });
}

module.exports = {
    razorpayIntegration,
    instance
}