const User = require("../model/userModel");

const isBlocked = async (req, res, next) => {
    try {
        const userId = req.session.user_id;

        const userData = await User.findById(userId);

        if (userData && userData.isBlocked) {

            req.session.destroy();
            return res.redirect('/login');
        }

        return next();

    } catch (error) {
        console.log(error.message);

        return res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    isBlocked
}