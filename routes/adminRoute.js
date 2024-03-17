const express = require('express');
const session = require("express-session");
const { isLogin, isLogout } = require("../middleware/adminAuth");
const bodyParser = require("body-parser");
const productController = require("../controller/productController");
const adminController = require("../controller/adminController");
const categoryController = require("../controller/categoryController");


const admin_route = express();

admin_route.use(express.urlencoded({ extended: true }));




admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');




admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));



//XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  ADMIN CONTROLLER XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX//



admin_route.get('/', isLogout, adminController.loadLogin);

admin_route.post('/', adminController.verfiyLogin);

admin_route.get('/adminHome', isLogin, adminController.loadHome);

admin_route.get('/logout', isLogin, adminController.logout);

admin_route.get('/adminDashboard', isLogin, adminController.adminDashboard);

admin_route.get('/new-user', isLogin, adminController.newUserLoad);

admin_route.post('/new-user', isLogin, adminController.addUser);

admin_route.get('/edit-user', isLogin, adminController.editUserLoad);

admin_route.post('/edit-user', isLogin, adminController.updateUsers);

admin_route.get('/orderList', isLogin, adminController.getOrderList)

admin_route.get('/orderDetails', isLogin, adminController.orderDetails);

admin_route.post('/orderStatusChanged', isLogin, adminController.orderStatusChanging)

admin_route.get('/couponManagement', isLogin, adminController.couponManagement);

admin_route.post('/couponManagement', isLogin, adminController.createCoupon);

admin_route.post('/couponListUnlist', isLogin, adminController.couponListUnlist);

admin_route.get('/salesReport', isLogin, adminController.adminsalesReport);

admin_route.get('/filterSalesData', isLogin, adminController.filterSalesReport);






//XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX PRODUCT CONTROLLER XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX//





admin_route.get('/addProduct', isLogin, productController.loadProduct);

admin_route.post('/addProduct', isLogin, productController.verifyProduct);

admin_route.get('/viewProduct', isLogin, productController.loadProductGrid);

admin_route.get('/editProduct', isLogin, productController.editProduct);

admin_route.post('/editProduct', isLogin, productController.updateProduct);

admin_route.get('/deleteProduct/:productId', isLogin, productController.deleteProduct);

admin_route.get('/blockProduct/:id', productController.blockProduct);


//XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX CATEGORY CONTROLLER XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX//



admin_route.get('/category', isLogin, categoryController.loadCategory);

admin_route.post('/category', isLogin, categoryController.createCategory);

admin_route.get('/editCategory', isLogin, categoryController.editCategory);

admin_route.post('/editCategory', isLogin, categoryController.updateCategory);

admin_route.get('/deleteCategory/:categoryDataId', isLogin, categoryController.deleteCategory);








admin_route.get('*', function (req, res) {
    res.redirect('/admin');
})


module.exports = admin_route;