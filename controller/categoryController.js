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

        const existingCategory = await addCategory.findOne({ name: lowercaseName });

        if (existingCategory) {
            return res.json({ status: "Category Name already exists" });
        }

        // Create a new category
        const newCategory = new addCategory({
            name,
            description,
            is_blocked
        });

        console.log(newCategory);

        // Save the product to the database
        await newCategory.save();

        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
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

            res.redirect('/admin/category')
            return;
        }

        const updatedIsBlocked = categoryData.is_blocked === 0 ? 1 : 0;


        const updateCategoryData = {

            name: req.body.name,
            description: req.body.description,
            is_blocked: updatedIsBlocked,

        }

        console.log('Update Data:', updateCategoryData);

        await addCategory.findByIdAndUpdate(categoryDataId, updateCategoryData);


        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
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