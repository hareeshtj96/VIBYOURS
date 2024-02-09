const express = require('express');
const session = require("express-session");



const admin_route = express();
admin_route.use(express.urlencoded({ extended: true }));



admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');



const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));



//XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  ADMIN CONTROLLER XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX//
const adminController = require("../controller/adminController");


admin_route.get('/', adminController.loadLogin);

admin_route.post('/', adminController.verfiyLogin);

admin_route.get('/adminHome', adminController.loadHome);

admin_route.get('/logout', adminController.logout);

admin_route.get('/adminDashboard', adminController.adminDashboard);

admin_route.get('/new-user', adminController.newUserLoad);

admin_route.post('/new-user', adminController.addUser);

admin_route.get('/edit-user', adminController.editUserLoad);

admin_route.post('/edit-user', adminController.updateUsers);

admin_route.get('/delete-user', adminController.deleteUser);




//XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX PRODUCT CONTROLLER XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX//

const productController = require("../controller/productController");



admin_route.get('/addProduct', productController.loadProduct);

admin_route.post('/addProduct', productController.verifyProduct);

admin_route.get('/viewProduct', productController.loadProductGrid);

admin_route.get('/editProduct', productController.editProduct);

admin_route.post('/editProduct', productController.updateProduct);

admin_route.get('/deleteProduct/:productId', productController.deleteProduct);


//XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX CATEGORY CONTROLLER XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX//

const categoryController = require("../controller/categoryController");


admin_route.get('/category', categoryController.loadCategory);

admin_route.post('/category', categoryController.createCategory);

admin_route.get('/editCategory', categoryController.editCategory);

admin_route.post('/editCategory', categoryController.updateCategory);

admin_route.get('/deleteCategory/:categoryDataId', categoryController.deleteCategory);


admin_route.get('*', function (req, res) {
    res.redirect('/admin');
})


module.exports = admin_route;