const addCategory = require("../model/categoryModel");




//loading category
const loadCategory = async (req, res) => {
    try {
        const categories = await addCategory.find()
        res.render('category', { categories });

    } catch (error) {
        console.log(error.message);
    }
}


//create category
const createCategory = async (req, res) => {
    const { name, description, is_blocked } = req.body;

    try {
        
        const lowercaseName = name.toLowerCase();

        const existingCategory = await addCategory.findOne({name: lowercaseName});

        if (existingCategory) {
            
            return res.status(400).json({ status: 'error', message: "Category Name already exists" });
        }

        const newCategory = new addCategory({
            name,
            description,
            is_blocked
        });

        const savedCategory = await newCategory.save();


        if (savedCategory) {
            // Send success response if the category is saved successfully
            return res.status(201).json({ status: "success", message: "Category created successfully", category: savedCategory });
        } else {
            // Handle the case where the category is not saved
            return res.status(500).json({ status: 'error', message: 'Failed to save the new category' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
}





//edit category
const editCategory = async (req, res) => {
    try {

        const id = req.query.id;
        const categoryData = await addCategory.findById(id);


        if (categoryData) {
            res.render('editCategory', { category: categoryData });
        } else {
            res.redirect('/admin/category');
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};





//update category
const updateCategory = async (req, res) => {
    try {
        const categoryDataId = req.query.id;
        const categoryData = await addCategory.findById(categoryDataId);

        if (!categoryData) {
            return res.status(404).json({ status: 'error', message: 'Category not found' });
        }

        const existingCategory = await addCategory.findOne({
            name: req.body.name,
            _id: { $ne: categoryDataId },
        });

        if (existingCategory) {
            return res.status(400).json({ status: 'error', message: 'Category Name already exists' });
        }

        const updatedIsBlocked = categoryData.is_blocked === 0 ? 1 : 0;

        const updateCategoryData = {
            name: req.body.name,
            description: req.body.description,
            is_blocked: updatedIsBlocked,
        };

        await addCategory.findByIdAndUpdate(categoryDataId, updateCategoryData);

        // Set the 'Content-Type' header to 'application/json'
        res.setHeader('Content-Type', 'application/json');
        
        // Send a proper JSON response
        res.status(200).json({ status: 'success', message: 'Category updated successfully' });
    } catch (error) {
        console.error(error);
        // Set the 'Content-Type' header to 'application/json'
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};



//delete category
const deleteCategory = async (req, res) => {
    try {
        const categoryDataId = req.params.categoryDataId;

        const result = await addCategory.findByIdAndDelete(categoryDataId);

        if (result) {

            res.redirect('/admin/category');
        } else {

            res.status(404).send('Category not found');
        }
    } catch (error) {

        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};





module.exports = {
    loadCategory,
    createCategory,
    editCategory,
    updateCategory,
    deleteCategory
}