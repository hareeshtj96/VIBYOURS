const addProduct = require("../model/productModel");

const pagination = async(req, res)=> {
    try {
        const totalProducts = await addProduct.find({}).count();
        console.log("totalProducts", totalProducts)
        const page = req.query.page || 1;
        const pageSize = 9;
        const skip = (page-1) * pageSize;
        const totalPages = Math.ceil(totalProducts/ pageSize);

        return {skip, page, pageSize, totalPages};
        
    } catch (error) {
        throw new Error("Pagination error:" + error.message);
    }
}

module.exports = {
    pagination,
}