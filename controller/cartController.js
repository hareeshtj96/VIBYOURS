const Cart = require("../model/cartModel");
const User = require("../model/userModel");
const addProduct = require("../model/productModel");
const mongoose = require('mongoose');


//add to cart
const addToCart = async (req, res) => {
  console.log("hi.................................................");
  try {
    const maximumQuantityToBuy = 5;

    console.log(req.body)
    const { productId, selectedSize, quantity } = req.body;
    // console.log(productId, size, quantity);

    // const productData = await addProduct.findOne({_id:productId});
    const productData = await addProduct.findById(productId);
    console.log('....', productData);

    if (!productData) {
      return res.status(404).json({ error: "Product not found" });
    }

    const users = req.session.user_id;
    console.log("users", users);
    if (!users) {

      return res.json({ status: false });
    }

    let selectingSize;

    if (productData.size && productData.size.length > 0) {
      // If size is specified, look for the selected size

      console.log('heloooooo');

      const availableSizes = productData.size.map(item => item.size);
      console.log('Available sizes:', availableSizes);
      // console.log(size,"jjjjjjjjjjjjjjjjjjjjjjjjjjjj");

      console.log("Selected Size:", selectedSize);

      selectingSize = productData.size.find((item) => item.size === selectedSize);

      console.log("Found Size:", selectingSize);

      console.log("selecting size qyantity", selectingSize.quantity);

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
    console.log(productIndex, "infdexllllllllllllllllllllllllll");
    const qty = parseInt(quantity);


    if (productIndex === -1) {
      console.log("-1 index inside");
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
      console.log("else index-1");

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







module.exports = {
  addToCart,
  // getCartPage,
}