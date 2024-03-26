const Cart = require("../model/cartModel");
const User = require("../model/userModel");
const addProduct = require("../model/productModel");
const Order = require("../model/orderModel");
const Coupon = require("../model/couponModel");
const Wallet = require("../model/walletModel");
const Wishlist = require("../model/wishlistModel");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { razorpayIntegration, instance } = require("../config/razorpay");
const paypal = require('@paypal/checkout-server-sdk');
const crypto = require('crypto');

const Razorpay = require('razorpay');




//creating randomString
async function generateUniqueId() {
  try {
    const uniqueId = uuidv4(); // Generate a UUID (Universally Unique Identifier)
    return uniqueId;
  } catch (error) {
    console.error("Error generating unique ID:", error);
    throw error;
  }
}

//getting cart page
const getCartPage = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });

    // console.log("userData", userData);

    const userCart = await Cart.findOne({ owner: userData._id });

    // console.log(("user  Cart",userCart));

    const array = userCart.items.map((item) => item.productId.toString());

    let wishlist = await Wishlist.findOne({ user: userData }).populate('product');

    const productCount = wishlist ? wishlist.product.length : 0;

    const productData = [];

    for (let i = 0; i < array.length; i++) {
      // productData.push(await addProduct.find({ _id: array[i], is_listed :1}))
      const product = await addProduct.findById(array[i]);

      if (product && product.is_listed === 1) {
        productData.push(product);
      }
    }

    const coupon = await Coupon.find({});

    const eligibleCoupons = coupon.filter(coupon => {
      return userCart.billTotal >= coupon.minimumAmount && userCart.billTotal <= coupon.maximumAmount && coupon.isActive
    })



    res.render("addtoCart", { productData, userCart, coupon: eligibleCoupons, productCount });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "internal Server Error" });
  }
};

//add to cart
const addToCart = async (req, res) => {
  // console.log("hi.................................................");
  try {
    const maximumQuantityToBuy = 5;

    // console.log(req.body)
    const { productId, selectedSize, quantity } = req.body;
    // console.log(productId, size, quantity);

    // const productData = await addProduct.findOne({_id:productId});
    const productData = await addProduct.findById(productId);
    // console.log('....', productData);

    if (!productData) {
      return res.status(404).json({ error: "Product not found" });
    }

    const users = req.session.user_id;
    // console.log("users", users);
    if (!users) {
      return res.json({ status: false });
    }

    let selectingSize;

    if (productData.size && productData.size.length > 0) {
      const availableSizes = productData.size.map((item) => item.size);
      // console.log('Available sizes:', availableSizes);

      // console.log("Selected Size:", selectedSize);

      selectingSize = productData.size.find(
        (item) => item.size === selectedSize
      );

      // console.log("Found Size:", selectingSize);

      // console.log("selecting size qyantity", selectingSize.quantity);

      if (!selectingSize || selectingSize.quantity < parseInt(quantity)) {
        console.log("inside invaloid");
        return res.json({ status: "invalidQuantity" });
      }
    }

    // Check if the product is blocked by admin (is_listed is 0)
    if (productData.is_listed === 0) {
      return res.json({ status: "ProductIsBlocked" });
    }

    if (parseInt(quantity) > maximumQuantityToBuy) {
      console.log("maximum inside");
      return res.json({ status: "maximumQuantity" });
    }

    let userCart = await Cart.findOne({ owner: users });

    if (!userCart) {
      const newCart = new Cart({ owner: users });
      await newCart.save();
      userCart = newCart;
    }

    const productIndex = userCart.items.findIndex(
      (product) =>
        product.productId == productId && product.size === selectedSize
    );
    // console.log(productIndex, "infdexllllllllllllllllllllllllll");
    const qty = parseInt(quantity);

    if (productIndex === -1) {
      // console.log("-1 index inside");
      const imageString = productData.images[0];
      userCart.items.push({
        productId: productId,
        quantity: qty,
        size: selectedSize,
        image: imageString,
        subTotal: qty * productData.sellingPrice,
      });
      await userCart.save();
    } else {
      // console.log("else index-1");

      if (
        selectingSize.quantity <
        userCart.items[productIndex].quantity + qty
      ) {
        console.log("outof stockjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj");
        return res.json({ status: "Out of Stock" });
      }
      if (userCart.items[productIndex].quantity + qty > maximumQuantityToBuy) {
        return res.json({ status: "maximumQuantity" });
      }
      userCart.items[productIndex].quantity += qty;
      userCart.items[productIndex].subTotal += qty * productData.sellingPrice;
    }

    let billTotal = 0;
    userCart.items.forEach((element) => {
      billTotal += element.subTotal;
    });

    userCart.billTotal = billTotal;

    let finalPrice = billTotal;

    userCart.finalPrice = finalPrice;

    await userCart.save();

    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

//removing item
const removeItem = async (req, res) => {
  try {
    const itemId = req.query.itemId;

    // console.log("itemId", itemId);

    const userId = req.session.user_id;

    // console.log("userId", userId);

    const userCart = await Cart.findOne({ owner: userId });

    if (!userCart) {
      return res.json({ status: false, message: "User cart not found." });
    }

    const removeItem = userCart.items.find(
      (item) => item.productId.toString() === itemId.toString()
    );

    if (!removeItem) {
      return res.json({
        status: false,
        message: "Item not found in the cart.",
      });
    }

    const subTotal = removeItem.subTotal;

    const updatedCart = await Cart.findOneAndUpdate(
      { owner: userId },
      { $pull: { items: { productId: itemId } } },
      { new: true }
    );

    updatedCart.billTotal = userCart.billTotal - subTotal;
    updatedCart.finalPrice = userCart.finalPrice - subTotal;
    await updatedCart.save();

    res.json({ status: true, message: "Item removed successfully." });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};


//changing quantity
const changingQuantity = async (req, res) => {
  // console.log("hiiiiiiiii changing quantity ");
  try {
    // console.log("Request body", req.body);

    const { userId, itemId, updatingQuantity, productId, size, index } =
      req.body;

    const userCart = await Cart.findOne({ owner: userId });
    const productDetails = await addProduct.findById(productId);

    const selectedSize = productDetails.size.find((item) => item.size === size);

    if (!selectedSize || selectedSize.quantity < parseInt(updatingQuantity)) {
      return res.json({ status: "Out of stock" });
    }

    const maxQuantityToBuy = 5;
    if (parseInt(updatingQuantity) > maxQuantityToBuy) {
      return res.json({ status: "maximumQuantity" });
    }

    userCart.items[index].quantity = parseInt(updatingQuantity);
    userCart.items[index].subTotal =
      parseInt(updatingQuantity) * productDetails.sellingPrice;

    let billTotal = 0;
    userCart.items.forEach((item) => {
      billTotal += item.subTotal;
    });
    userCart.billTotal = billTotal;
    userCart.finalPrice = billTotal;

    await userCart.save();

    res.json({
      status: "success",
      total: parseInt(billTotal),
      quantity: updatingQuantity,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Invalid Server Error" });
  }
};

//load checkout page
const loadCheckOUt = async (req, res) => {
  try {
    const userId = req.session.user_id;

    // console.log("userId", userId);

    const productData = await addProduct.find({});

    let wishlist = await Wishlist.findOne({ user: userId }).populate('product');

    const productCount = wishlist ? wishlist.product.length : 0;

    const userCart = await Cart.findOne({ owner: userId }).populate({
      path: "items.productId",
      model: "addProduct",
      select: "producttitle",
    });

    // Fetch user's saved addresses
    const userData = await User.findById(userId);
    const savedAddresses = userData.address || [];

    // console.log("savedAddresses", savedAddresses);

    // Check if the product is blocked by admin (is_listed is 0)
    if (productData.is_listed === 0) {
      return res.json({ status: "ProductIsBlocked" });
    }
    const totalAmount = userCart.billTotal;

    // console.log("totalAmount", totalAmount);
    try {
      res.render("checkOut", {
        userId,
        userCart,
        productData,
        totalAmount,
        savedAddresses,
        productCount
      });
    } catch (error) {
      console.error("Template rendering error:", error.message);
      res.status(500).json({ message: "Template Rendering Error" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Invalid Server Error" });
  }
};



//checkout functionality
const doCheckOut = async (req, res) => {
  console.log("hiiiii docheckout workss.........");
  try {
    const paymentOption = req.body.paymentOption;
    const selectedAddressId = req.body.selectedAddress;

    // console.log("selectedAddressid", selectedAddressId);

    if (paymentOption === 'Cash on Delivery') {
      const userCart = await Cart.findOne({ owner: req.session.user_id });
      if (userCart.billTotal < 1000) {
        return res.status(400).json({ message: "Cash on Delivery is not available for orders less than 1000 rs" });
      }
    }

    let address;
    if (selectedAddressId) {
      const selectedAddress = await User.findOne({
        "address._id": selectedAddressId,
      }).populate("address");

      // console.log("selectedAddress", selectedAddress);

      if (!selectedAddress) {
        return res.status(400).json({ message: "Invalid Selected Address" });
      }

      const firstAddress = selectedAddress.address[0];

      // console.log("firstAddress", firstAddress);

      address = {
        savedAddress: selectedAddressId,
        name: firstAddress.name,
        mobile: firstAddress.mobile,
        pincode: firstAddress.pincode,
        housename: firstAddress.housename,
        locality: firstAddress.locality,
        city: firstAddress.city,
        state: firstAddress.state,
        landmark: firstAddress.landmark,
        addressType: firstAddress.addressType,
      };

      // console.log("address", address);
    } else {
      address = {
        name: req.body.name,
        houseName: req.body.houseName,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        pincode: req.body.pincode,
        phone: req.body.phone,
        email: req.body.email,
      };
    }
    const user = await User.findById({ _id: req.session.user_id });

    const userCart = await Cart.findOne({ owner: user._id });
    // console.log("usercart", userCart);

    const selectedItems = userCart.items;

    for (const item of selectedItems) {
      const productId = item.productId;

      const product = await addProduct.findOne({ _id: productId });

      if (product) {
        const sizeToUpdate = product.size.find((s) => s.size === item.size);

        if (sizeToUpdate && sizeToUpdate.quantity >= item.quantity) {
          sizeToUpdate.quantity -= item.quantity;

          await product.save();
        }
      } else {
        console.log("Product not found");
      }
    }

    const orderId = await generateUniqueId();

    // console.log("orderId", orderId);
    console.log("Payment Option:", paymentOption);

    if (paymentOption === 'Cash on Delivery') {
      console.log("hiiii it reached cod");
      const orderData = new Order({
        user: user._id,
        items: selectedItems.map((item) => ({
          productId: item.productId,
          image: item.image,
          quantity: item.quantity,
          size: item.size,
          price: item.subTotal,
        })),
        billTotal: userCart.finalPrice || 0,
        orderId: orderId,
        paymentStatus: "Pending",
        paymentMethod: paymentOption,
        deliveryAddress: address,
        discountPrice: userCart.discountPrice,
        "requests.type": "-",
      });
      // console.log("orderData", orderData);

      await orderData.save();

      userCart.items = [];

      await userCart.save();

      res.json({ success: true, orderId: orderId });

    } else if (paymentOption === 'Online Payment') {
      console.log("hiii it reached online payment");
      var instance = new Razorpay({
        key_id: 'rzp_test_NGuzvYo6A3U204',
        key_secret: 'NOgcQagQuA0Ag5ff05a7Gxxw'
      });

      var options = {
        amount: userCart.finalPrice + 50,
        currency: "INR",
        receipt: orderId
      };

      try {
        const razorpayOrders = await new Promise((resolve, reject) => {
          instance.orders.create(options, (error, order) => {
            if (error) {
              console.error("Error creating Razorpay order:", error);
              reject(error);
            } else {
              console.log("razorpayOrder", order);
              resolve([order]); // Wrap the order in an array for consistency
            }
          });
        });

        res.json({ success: true, order: razorpayOrders[0], orderId: orderId }); // Access the first element of the array
      } catch (error) {
        console.error("Error in Razorpay order creation:", error);
        res.status(400).json({
          success: false,
          message: "Something went wrong!",
          error: error.message
        });
      }
    } else if (paymentOption === 'Paypal') {
      console.log("it is reached paypal")
      var environment = new paypal.core.SandboxEnvironment(
        'Aew_9QXs6uIPPZ-D93id84JgWaJ0BUnd1bIRBQTtHZQDvLSyqvU8iFVHhbK5iCNkHm8XLerOl9JtLd5t',
        'EAUvWy32LWlEIFHoXb_0foMEc95pFauvu4CyBhVUri2274xtmwBgrl-Wg7q8wVFnyuFkHBwVHh8VSCCd'
      );
      const client = new paypal.core.PayPalHttpClient(environment);

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: userCart.billTotal,
          },
        }],
      });

      try {
        const order = await client.execute(request);

        res.json({
          success: true,
          order: order.result,
          orderId: orderId,
        });
      } catch (error) {
        console.error("Error in PayPal order creation:", error);
        res.status(400).json({
          success: false,
          message: "Something went wrong with PayPal!",
          error: error.message,
        });
      }

    } else {
      try {

        let wallet = await Wallet.findOne({ user: user._id });

        console.log("wallet balance before deduction:", wallet.balance);

        if (!wallet || wallet.balance < userCart.finalPrice) {
          console.log("Insuffiecient wallet balance", wallet.balance)
          console.log("User cart bill total", userCart.finalPrice);
          return res.status(400).json({ success: false, message: "Insufficient Wallet balance" })
        }

        console.log("wallet balance after deduction", wallet.balance - userCart.finalPrice)

        wallet.balance -= userCart.finalPrice;
        wallet.transactions.push({
          amount: -userCart.finalPrice,
          type: 'debit',
          description: "Purchase using wallet"
        })
        await wallet.save();

        console.log("Wallet balance after save:", wallet.balance);

        const orderData = new Order({
          user: user._id,
          items: selectedItems.map((item) => ({
            productId: item.productId,
            image: item.image,
            quantity: item.quantity,
            size: item.size,
            price: item.subTotal,
          })),
          billTotal: userCart.finalPrice || 0,
          orderId: orderId,
          paymentStatus: "Pending",
          paymentMethod: paymentOption,
          deliveryAddress: address,
          discountPrice: userCart.discountPrice,

        });
        await orderData.save();

        userCart.items = [];
        await userCart.save();

        console.log("Order placed successfully. New Wallet Balance:", wallet.balance);

        res.status(200).json({
          success: true,
          message: "Order placed successfully",
          orderId: orderId
        })

      } catch (error) {
        console.error("Error in the 'else' block:", error);
        if (error instanceof InsufficientBalanceError) {
          res.status(400).json({ success: false, message: "Insufficient Wallet balance" })
        } else {
          res.status(500).json({ success: false, message: "Invalid Server Error" });

        }

      }


    }

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Invalid Server Error" });
  }
};


//razorpay integration
const razorpayVerification = async (req, res) => {

  console.log("jhiiiii......... razorpya.....");
  try {

    const body = `${req.body.razorpay_orderid}|${req.body.razorpay_payment_id}`;

    // console.log("body", body);

    const address = req.body.address || 'home';

    // console.log("address", address);

    const user = await User.findOne({ _id: req.session.user_id });

    // console.log("user", user);

    const userCart = await Cart.findOne({ owner: user._id });

    // console.log("usercart", userCart);

    if (!userCart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    const orderAddress = await User.findOne({ _id: user._id });

    // console.log("orderAddress", orderAddress);

    if (!orderAddress) {
      return res.status(400).json({ message: "Address not found" });
    }

    const addressDetails = orderAddress.address.find(item => item.addressType === address);

    // console.log("addressDetails", addressDetails);

    if (!addressDetails) {

    }

    const orderId = await generateUniqueId();

    const secretKey = 'rzp_test_NGuzvYo6A3U204';

    const SignatureExpected = crypto.createHmac("sha256", secretKey).update(body.toString()).digest("hex");

    // console.log("signature Expected", SignatureExpected);

    const orderData = new Order({
      user: user._id,
      orderid: req.body.razorpay_orderid,
      orderId: orderId,
      items: userCart.items.map((cartItem) => ({
        productId: cartItem.productId,
        image: cartItem.image,
        quantity: cartItem.quantity,
        size: cartItem.size,
        price: cartItem.subTotal,

      })),
      billTotal: userCart.finalPrice,
      paymentStatus: 'Success',
      paymentMethod: 'razorpay',
      deliveryAddress: addressDetails,
      discountPrice: userCart.discountPrice,
      "requests.type": "-",

    });
    //  console.log("orderData", orderData);

    await orderData.save();

    userCart.items = [];

    await userCart.save();
    //  console.log("works well.......................");
    res.json({ success: true, message: "Order processed Successfully", orderId: orderId, orderData });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}



//paypal verfication
const paypalVerification = async (req, res) => {
  console.log("hiiiii......... paypal.....");
  try {
    const paypalOrderId = req.body.paypalOrderId;
    const payerID = req.body.payerID;

    const address = req.body.address || 'home';

    // console.log("address", address);

    const user = await User.findOne({ _id: req.session.user_id });

    // console.log("user", user);

    const userCart = await Cart.findOne({ owner: user._id });

    // console.log("userCart", userCart);

    if (!userCart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    const orderAddress = await User.findOne({ _id: user._id })

    // console.log("orderAddress", orderAddress);

    if (!orderAddress) {
      return res.status(400).json({ message: "Address not found" });
    }

    const addressDetails = orderAddress.address.find(item => item.addressType === address);

    // console.log("addressDetails", addressDetails);

    if (!addressDetails) {

    }

    const orderId = await generateUniqueId();

    const orderData = new Order({
      user: user._id,
      paypalorderId: paypalOrderId,
      payapalpayerid: payerID,
      orderId: orderId,
      items: userCart.items.map((cartItem) => ({
        productId: cartItem.productId,
        image: cartItem.image,
        quantity: cartItem.quantity,
        size: cartItem.size,
        price: cartItem.subTotal,
      })),
      billTotal: userCart.finalPrice,
      paymentStatus: 'Success',
      paymentMethod: 'PayPal',
      deliveryAddress: addressDetails,
      discountPrice: userCart.discountPrice,
      "requests.type": "-",
    })

    await orderData.save();

    userCart.items = [];

    await userCart.save();

    res.json({ success: true, message: "Order processed Successfully", orderId: orderId, orderData });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


//payment failed condition
const paymentFailed = async (req, res) => {
  try {

    const address = req.body.address || 'home';
    const user = await User.findOne({ _id: req.session.user_id });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const orderAddress = await User.findOne({ _id: user._id });

    if (!orderAddress) {
      return res.status(400).json({ message: "Address not found" });
    }

    const addressDetails = orderAddress.address.find(item => item.addressType === address);

    if (!addressDetails) {

    }
    const userCart = await Cart.findOne({ owner: user._id }).populate(
      {
        path: 'items.productId',
        model: 'addProduct'
      }
    );

    if (!userCart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }


    const orderId = await generateUniqueId();

    const orderData = new Order({
      user: user._id,
      orderid: req.body.razorpay_orderid,
      orderId: orderId,
      items: userCart.items.map((cartItem) => ({
        productId: cartItem.productId,
        image: cartItem.image,
        quantity: cartItem.quantity,
        size: cartItem.size,
        price: cartItem.subTotal,

      })),
      billTotal: userCart.finalPrice,
      paymentStatus: 'Pending',
      paymentMethod: 'razorpay',
      deliveryAddress: addressDetails,
      discountPrice: userCart.discountPrice,
      "requests.type": "-",

    });


    await orderData.save();

    userCart.items = [];
    userCart.isApplied = false;
    await userCart.save();

    return res.json({ success: true, message: "Order processed successfully", orderId: orderId });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


//payment retry
const retryPayment = async (req, res) => {
  console.log('hi.....')
  try {
    const id = req.body.id;
    console.log("id", id);
    const order = await Order.findOne({ orderId: id });
    console.log("order", order);

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: id },
      { $set: { paymentStatus: 'Success' } }, 
      { new: true }
    );

    console.log("Updated order:", updatedOrder);

    var instance = new Razorpay({
      key_id: 'rzp_test_NGuzvYo6A3U204',
      key_secret: 'NOgcQagQuA0Ag5ff05a7Gxxw'
    });

    var options = {
      amount: (order.billTotal + 50) * 100,
      currency: "INR",
      receipt: id
    };

    instance.orders.create(options, async (err, razorpayOrder) => {
      if (!err) {
        res.status(201).json({
          success: true,
          message: "Order placed successfully.",
          order: razorpayOrder,
        });
      } else {
        console.error("Error creating Razorpay order:", err);
        res.status(400).json({
          success: false,
          message: "Something went wrong!",
          error: err.message,
        });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


//Payment verification
const paymentVerification = async(req, res) => {
  try {
    const id = req.body.id;
    const order = await Order.findOneAndUpdate({ orderId: id}, { paymentStatus: "Success"});

    res.json({ success: true, message: "Order is successfully processed", orderId: id})
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


//order confirmation page
const orderConfirmation = async (req, res) => {
  // console.log("order confrimation working.......");
  try {
    const orderId = req.query.orderId;
    // console.log("orderId:", orderId);

    const user = req.session.user_id;

    let wishlist = await Wishlist.findOne({ user: user._id }).populate('product');

    const productCount = wishlist ? wishlist.product.length : 0;

    const userCart = await Cart.findOne({ owner: req.session.user_id });


    const orderData = await Order.findOne({ orderId: orderId }).populate({
      path: "items.productId",
      model: "addProduct",
      select: "producttitle",
    });
    // console.log("orderData", orderData);

    const productData = await addProduct.find({});

    if (orderData) {
      for (const item of orderData.items) {
        const productId = item.productId;
        await addProduct.findByIdAndUpdate(productId, { $inc: { count: 1 } });
      }
    }

    res.render("orderConfirmation", { orderData: orderData, productData, productCount, userCart });
  } catch (error) {
    console.log(error.message);
    res.redirect("/dashboard");
  }
};




//order details
const getOrderDetails = async (req, res) => {
  try {
    const orderData = await Order.findOne({
      orderId: req.query.orderId,
    }).populate({
      path: "items.productId",
      model: "addProduct",
      select: "producttitle",
    });
    // console.log(orderData, "orderData");

    const user = req.session.user_id;

    let wishlist = await Wishlist.findOne({ user: user._id }).populate('product');

    const productCount = wishlist ? wishlist.product.length : 0;

    res.render("orderDetails", { orderData, productCount });
  } catch (error) {
    console.log("getorderDetails", error.message);
    res.status(500).json({ message: "internal Server Error" });
  }
};

//cancel order
const cancelOrder = async (req, res) => {
  try {
    console.log("reqbody", req.body);
    const order_Id = req.body.orderId;
    console.log("orderId", order_Id);

    const orderData = await Order.findOneAndUpdate(
      { orderId: order_Id },
      { $set: { status: "Pending Cancel Order Request" } },
      { new: true }
    );

    console.log("orderData", orderData);


    if (orderData) {

      const paymentMethod = orderData.paymentMethod;

      if (paymentMethod === 'Cash on Delivery') {
        return res.json({ status: "Order Cancelled" });
      } else {

        orderData.status = 'Cancelled';
        orderData.paymentStatus = 'Refunded';

        await orderData.save();

        const walletId = orderData.user._id;
        const wallet = await Wallet.findOne({ user: walletId }).populate('transactions')

        if (wallet) {
          const refundAmount = orderData.billTotal;
          wallet.balance += refundAmount;

          const transaction = {
            amount: refundAmount,
            type: 'Refund',
          };
          wallet.transactions.push(transaction);

          await wallet.save();
        }

      }

      for (const placedProduct of orderData.items) {

        const placedProductId = placedProduct.productId;

        console.log("placedProductid", placedProductId);

        const placedQuantity = placedProduct.quantity;
        console.log("placed qauntity", placedQuantity);

        const placedProductSize = String(placedProduct.size);

        console.log("plaecdsize", placedProductSize);

        const product = await addProduct.findById(placedProductId);

        if (placedProductSize) {
          let updatedSize;
          updatedSize = product.size.map((size) => {
            if (String(size.size) === placedProductSize) {
              size.quantity += placedQuantity;
            }
            return size;
          });

          product.size = updatedSize;
          await product.save();
        }

      }
      // console.log("jiiiiiiiiiiiiiii");
      res.json({ status: "Order Cancelled and Refunded" });
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Return order
const returnOrder = async (req, res) => {
  try {
    const order_Id = req.body.orderId;
    const reason = req.body.reason;

    console.log("order_id", order_Id);

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: order_Id },
      {
        $set: {
          status: "Pending Return Request",
        },
        $push: {
          requests: {
            type: "Return",
            status: "Pending",
            reason: reason,
          },
        },
      },
      { new: true }
    );

    console.log("orderData", updatedOrder);

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    updatedOrder.status = 'Returned';
    updatedOrder.paymentStatus = 'Refunded';
    await updatedOrder.save();

    const walletId = updatedOrder.user._id;
    const wallet = await Wallet.findOne({ user: walletId }).populate('transactions');

    if (Wallet) {
      const refundAmount = updatedOrder.billTotal;
      wallet.balance += refundAmount;

      const transaction = {
        amount: refundAmount,
        type: 'Refund',
      };
      wallet.transactions.push(transaction);

      await wallet.save();
    }

    for (const item of updatedOrder.items) {
      const productId = item.productId;

      const updatedProduct = await addProduct.findOneAndUpdate(
        { _id: productId },
        { $inc: { quantity: item.quantity } },
        { new: true }
      );

      console.log("updated Product", updatedProduct);

      if (!updatedProduct) {
        console.error("Product with ID ${productId} not found");
      }
    }

    res
      .status(200)
      .json({ message: "Order returned successfully", order: updatedOrder });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addToCart,
  getCartPage,
  removeItem,
  changingQuantity,
  loadCheckOUt,
  doCheckOut,
  razorpayVerification,
  paypalVerification,
  paymentFailed,
  retryPayment,
  paymentVerification,
  orderConfirmation,
  getOrderDetails,
  cancelOrder,
  returnOrder,
};
