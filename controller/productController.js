const addProduct = require("../model/productModel");
const multer = require('multer');


//Multer storage configuration
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

// Multer instance
const upload = multer({
    storage: storage,
}).array('images', 5); // maximum of 5 images



//loading product 
const loadProduct = async (req, res) => {
    try {
        res.render('addProduct');
    } catch (error) {
        console.log(error.message);
    }
}


//verify products
const verifyProduct = async (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ error: 'Error uploading file' });
        } else if (err) {
            return res.status(500).json({ error: err.message });
        }

        const { producttitle, description, brand, size, price, category } = req.body;

        try {
            // Verify if product exists with the same title
            const existingProduct = await addProduct.findOne({ 'producttitle': producttitle });

            if (existingProduct) {
                return res.status(400).json({ error: 'Product with this title already exists.' });
            }

            // Create a new product
            const newProduct = new addProduct({
                producttitle,
                description,
                brand,
                size,
                price,
                category,
                images: req.files.map(file => file.filename),
            });

            console.log(newProduct);

            // Save the product to the database
            await newProduct.save();

            res.redirect('/admin/addProduct');
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
}


//view products
const loadProductGrid = async (req, res) => {
    try {
        const addProducts = await addProduct.find()
        res.render('viewProduct', { addProduct: addProducts });

    } catch (error) {
        console.log(error.message);
    }
}

//edit products
const editProduct = async (req, res) => {
    try {

        const id = req.query.id;
        const productData = await addProduct.findById(id);


        if (productData) {
            res.render('editProduct', { product: productData });
        } else {
            res.redirect('/admin/viewProduct');
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};



const updateProduct = async (req, res) => {
    try {

        console.log('Product ID:', req.query.id);

        console.log('Form Data:', req.body);


        upload(req, res, async function (err) {

            const productDataId = req.query.id;


            let existingImages = [];
            const existingProduct = await addProduct.findById(req.query.id);

            if (existingProduct && existingProduct.images && Array.isArray(existingProduct.images)) {
                existingImages = existingProduct.images;
            }

            let newImages = [];
            if (req.files && Array.isArray(req.files)) {
                newImages = req.files.map(file => file.filename);
            }

            const allImages = existingImages.concat(newImages)


            const updateData = {

                producttitle: req.body.producttitle,
                description: req.body.description,
                brand: req.body.brand,
                size: req.body.size,
                price: req.body.price,
                category: req.body.category,
                images: allImages,

            }

            console.log('Update Data:', updateData);

            await addProduct.findByIdAndUpdate(productDataId, updateData);


            res.redirect('/admin/viewProduct');

        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


//delete products
const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.productId;

        // Use findByIdAndDelete to find and delete the product by its ID
        const result = await addProduct.findByIdAndDelete(productId);

        if (result) {
            // Product successfully deleted
            res.redirect('/admin/viewProduct');
        } else {
            // Product not found
            res.status(404).send('Product not found');
        }
    } catch (error) {
        // Handle other errors
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


module.exports = {
    loadProduct,
    verifyProduct,
    loadProductGrid,
    editProduct,
    updateProduct,
    deleteProduct
}