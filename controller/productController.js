const addProduct = require("../model/productModel");
const addCategory = require("../model/categoryModel");
const multer = require('multer');


//Multer storage configuration
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

// File filter function
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|webp/;
    const extname = allowedFileTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        return cb(new Error('Error: Only images of jpeg, jpg, png, and webp formats are allowed.'));
    }
};

// Multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
}).array('images', 5); // maximum of 5 images




const loadProduct = async (req, res) => {
    try {
        const categories = await addCategory.find({ is_blocked: 0 })
        res.render('addProduct', { categories });
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
        console.log(req.body,"hhhhhhhhhhhhhhhhhhhhhhhhhhhhh");

        const { producttitle, description, brand, sizeS, sizeM, sizeL, sizeXL, price, category, is_listed } = req.body;



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
                size: [
                    { size: 'S', quantity: sizeS },
                    { size: 'M', quantity: sizeM },
                    { size: 'L', quantity: sizeL },
                    { size: 'XL', quantity: sizeXL }
                ],
                price,
                category,
                images: req.files.map(file => file.filename),
                is_listed: 1
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
        const addProducts = await addProduct.find({})
        res.render('viewProduct', { addProduct: addProducts });

    } catch (error) {
        console.log(error.message);
    }
}

//edit products
const editProduct = async (req, res) => {
    try {

        const addProducts = await addProduct.find()

        const productId = req.query.id;
        const existingProduct = await addProduct.findById(productId);

        const categories = await addCategory.find({ is_blocked: 0 });

        if (!existingProduct) {
            return res.status(404).send("Product not found.");
        }

        let existingImages = existingProduct.images || [];
        const newImages = req.files ? req.files.map(file => file.filename) : [];


        for (let i = 0; i < Math.min(newImages.length, existingImages.length); i++) {
            existingImages[i] = newImages[i];
        }

        if (newImages.length > existingImages.length) {
            existingImages.push(...newImages.slice(existingImages.length));
        }

        existingImages = existingImages.slice(0, 4);


        const { sizeS, sizeM, sizeL, sizeXL } = req.body;

        const updatedProduct = {
            
            producttitle: req.body.producttitle,
            description: req.body.description,
            brand: req.body.brand,
            size: [
                { size: 'S', quantity: sizeS },
                { size: 'M', quantity: sizeM },
                { size: 'L', quantity: sizeL },
                { size: 'XL', quantity: sizeXL }
            ],
            price: req.body.price,
            category: req.body.category,
            images: existingImages,
            is_listed: 1
        };

        const productData = await addProduct.findByIdAndUpdate(productId, updatedProduct).populate('category');


        // const id = req.query.id;
        // const productData = await addProduct.findById(id);

        console.log(productData);

        if (productId) {
            res.render('editProduct', { product: productData, categories  });
        } else {
            res.redirect('/admin/viewProduct');
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


//update products
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


            const { sizeS, sizeM, sizeL, sizeXL } = req.body;

            const updatedCategory = req.body.category

            const updateData = {

                producttitle: req.body.producttitle,
                description: req.body.description,
                brand: req.body.brand,
                size: [
                    { size: 'S', quantity: sizeS },
                    { size: 'M', quantity: sizeM },
                    { size: 'L', quantity: sizeL },
                    { size: 'XL', quantity: sizeXL }
                ],
                price: req.body.price,
                category: updatedCategory,
                images: allImages,
                is_listed: 1,

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

        const result = await addProduct.findByIdAndDelete(productId);

        if (result) {

            res.redirect('/admin/viewProduct');
        } else {

            res.status(404).send('Product not found');
        }
    } catch (error) {

        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

//block products
const blockProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        
        const product = await addProduct.findById(productId);

        if(!product) {
            return res.status(404).json({ error: 'Product not found'})
        }

        product.is_listed = product.is_listed === 1 ? 0 : 1;;

        await product.save();

        res.redirect('/admin/viewProduct')

    }catch (error) {
        console.error('Error blocking product:', error);
        res.status(500).json({ error: 'Internal Server Error'});
    }
}


module.exports = {
    loadProduct,
    verifyProduct,
    loadProductGrid,
    editProduct,
    updateProduct,
    deleteProduct,
    blockProduct
}