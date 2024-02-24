const Cart = require("../model/cartModel");
const User = require("../model/userModel");
const addProduct = require("../model/productModel");
const Order = require("../model/orderModel");
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');



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

    const userCart = await Cart.findOne({ owner: userData._id })

    // console.log(("user  Cart",userCart));

    const array = [];

    for (let i = 0; i < userCart.items.length; i++) {
      array.push(userCart.items[i].productId.toString())
    }


    // console.log("array", array);

    const productData = [];

    for (let i = 0; i < array.length; i++) {
      productData.push(await addProduct.findById({ _id: array[i] }))
    }

    // console.log("product data", productData);

    res.render('addtoCart', { productData, userCart })

  } catch (error) {
    console.log(error.message);

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

      const availableSizes = productData.size.map(item => item.size);
      // console.log('Available sizes:', availableSizes);


      // console.log("Selected Size:", selectedSize);

      selectingSize = productData.size.find((item) => item.size === selectedSize);

      // console.log("Found Size:", selectingSize);

      // console.log("selecting size qyantity", selectingSize.quantity);

      if (!selectingSize || selectingSize.quantity < parseInt(quantity)) {
        console.log("inside invaloid");
        return res.json({ status: "invalidQuantity" });

      }
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
      (product) => product.productId == productId && product.size === selectedSize
    );
    // console.log(productIndex, "infdexllllllllllllllllllllllllll");
    const qty = parseInt(quantity);


    if (productIndex === -1) {
      // console.log("-1 index inside");
      const imageString = productData.images[0]
      userCart.items.push({
        productId: productId,
        quantity: qty,
        size: selectedSize,
        image: imageString,
        subTotal: qty * productData.price,
      });
      await userCart.save();
    } else {
      // console.log("else index-1");

      if (selectingSize.quantity < userCart.items[productIndex].quantity + qty) {

        console.log("outof stockjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj");
        return res.json({ status: "Out of Stock" });
      }
      if (userCart.items[productIndex].quantity + qty > maximumQuantityToBuy) {
        return res.json({ status: "maximumQuantity" });
      }
      userCart.items[productIndex].quantity += qty;
      userCart.items[productIndex].subTotal += qty * productData.price;
    }

    let billTotal = 0;
    userCart.items.forEach((element) => {
      billTotal += element.subTotal;
    });

    userCart.billTotal = billTotal;

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

    const userCart = await Cart.findOne({ owner: userId })



    if (!userCart) {
      return res.json({ status: false, message: 'User cart not found.' });
    }


    const removeItem = userCart.items.find(item => item.productId.toString() === itemId.toString());


    if (!removeItem) {
      return res.json({ status: false, message: 'Item not found in the cart.' });
    }

    const subTotal = removeItem.subTotal

    const updatedCart = await Cart.findOneAndUpdate(
      { owner: userId },
      { $pull: { items: { productId: itemId } } },
      { new: true }
    );

    updatedCart.billTotal = userCart.billTotal - subTotal;
    await updatedCart.save();

    res.json({ status: true, message: 'Item removed successfully.' })

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: false, message: 'Internal server error.' });

  }
}





const changingQuantity = async (req, res) => {
  // console.log("hiiiiiiiii changing quantity ");
  try {

    // console.log("Request body", req.body);

    const { userId, itemId, updatingQuantity, productId, size, index } = req.body;

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
    userCart.items[index].subTotal = parseInt(updatingQuantity) * productDetails.price;

    let billTotal = 0;
    userCart.items.forEach((item) => {
      billTotal += item.subTotal;
    });
    userCart.billTotal = billTotal;

    await userCart.save();

    res.json({ status: "success", total: parseInt(billTotal), quantity: updatingQuantity });


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

    const userCart = await Cart.findOne({ owner: userId });

    // console.log("userCart", userCart);

    const totalAmount = userCart.billTotal;

    // console.log("totalAmount", totalAmount);

    res.render('checkOut', { userId, userCart, productData, totalAmount });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Invalid Server Error" });
  }
}


//checkout functionality
const doCheckOut = async (req, res) => {
  // console.log("hiiiii docheckout workss.........");
  try {
    const paymentOption = req.body.paymentOption;

    const address = {
      name: req.body.name,
      houseName: req.body.houseName,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      pincode: req.body.pincode,
      phone: req.body.phone,
      email: req.body.email
    };

    // console.log("address:", address);


    const user = await User.findById({ _id: req.session.user_id });



    const userCart = await Cart.findOne({ owner: user._id });

    // console.log("usercart", userCart);

    const selectedItems = userCart.items;

    // console.log("selectedItems", selectedItems);

    for (const item of selectedItems) {
      const productId = item.productId;

      // console.log("Querying product with ID:", productId);

      const product = await addProduct.findOne({ _id: productId });

      // console.log("product", product);

      if (product) {
        // console.log("product quantity before update:", product.size.map(s=> s.quantity));

        const sizeToUpdate = product.size.find(s => s.size === item.size);

        if (sizeToUpdate && sizeToUpdate.quantity >= item.quantity) {
          sizeToUpdate.quantity -= item.quantity;

          await product.save();
          // console.log("product quantity after update:", sizeToUpdate.quantity);
        }
      } else {
        console.log('Product not found');
      }
    }

    const orderId = await generateUniqueId()

    // console.log("oderId", orderId);

    const orderData = new Order({
      user: user._id,
      cart: userCart._id,
      items: selectedItems.map(item => ({
        productId: item.productId,
        image: item.image,
        quantity: item.quantity,
        price: item.subTotal,
      })),
      billTotal: userCart.billTotal || 0,
      orderId: orderId,
      paymentStatus: "Pending",
      paymentMethod: paymentOption,
      deliveryAddress: address,
      'requests.type': '-'

    });

    // console.log("orderData", orderData);

    await orderData.save();

    userCart.items = [];

    await userCart.save();

    // res.redirect( `/orderConfirmation?orderId=${orderId}`);
    res.json({ orderId: orderId });




  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Invalid Server Error" });
    res.redirect('/dashboard');
  }
}



//order confirmation page
const orderConfirmation = async (req, res) => {
  console.log("order confrimation working.......");
  try {

    const orderId = req.query.orderId;
    // console.log("orderId:", orderId);

    const orderData = await Order.findOne({ orderId: orderId })
    // console.log("orderData", orderData);

    const productData = await addProduct.find({});

    res.render('orderConfirmation', { orderData: orderData, productData });

  } catch (error) {
    console.log(error.message)
    res.redirect('/dashboard');
  }
}



//order details
const getOrderDetails = async(req, res)=> {
  try {
    const orderData = await Order.findOne({ orderId: req.query.orderId});
    console.log(orderData, "orderData");

    res.render('orderDetails', {orderData});
  } catch (error) {
    console.log('getorderDetails',error.message);
  }
}


module.exports = {
  addToCart,
  getCartPage,
  removeItem,
  changingQuantity,
  loadCheckOUt,
  doCheckOut,
  orderConfirmation,
  getOrderDetails
}