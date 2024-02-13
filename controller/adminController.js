const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const randomstring = require('randomstring');




//login page rendering
const loadLogin = async (req, res) => {
    // console.log("loadlogin is working")
    try {
        res.render('adminLogin')
    } catch (error) {
        console.log(error);
    }
}

//verifying login
const verfiyLogin = async (req, res) => {
    // console.log("verify login working")
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);


            if (passwordMatch) {

                if (userData.is_admin === 0) {
                    res.render('adminLogin', { message: "You are not an admin" });

                } else {
                    req.session.user_id = userData._id;
                    res.redirect('/admin/adminHome');
                }
            } else {
                //incorrect password
                res.render('adminLogin', { message: "Email and Password is incorrect" });
            }
        } else {
            //user not found
            res.render('adminLogin', { message: "Email and Password are incorrect" })
        }
    } catch (error) {

        console.log('verify login', error.message);
    }

}

//loading home
const loadHome = async (req, res) => {
    try {
        res.render('adminHome');
    } catch (error) {
        console.log("loadHome", error.message);
    }
}


//admin logout
const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
        console.log('logout', error.message);

    }
}

//admin dashboard
const adminDashboard = async (req, res) => {
    try {
        const usersData = await User.find({ is_admin: 0 });
        // console.log(usersData);
        res.render('adminDashboard', { users: usersData });

    } catch (error) {
        console.error(error.message);

    }
}


//adding new user
const newUserLoad = async (req, res) => {
    try {
        res.render('new-user');

    } catch (error) {
        console.log(error.message);

    }
}

const addUser = async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const mobile = req.body.mobile;
        const password = randomstring.generate(8);

        if (mobile.length !== 10) {
            return res.render('new-user', { message: 'Mobile number must be 10 characters long.' });
        }

        const user = new User({
            name: name,
            email: email,
            mobile: mobile,
            password: password,
            is_admin: 0
        });

        const userData = await user.save();

        if (userData) {
            res.redirect('/admin/adminDashboard');
        } else {
            res.render('new-user', { message: 'Something went wrong' });
        }

    } catch (error) {
        console.log(error.message);

    }
}


//edit user
const editUserLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById({ _id: id })

        if (userData) {
            res.render('edit-user', { user: userData });
        } else {
            res.redirect('/admin/adminDashboard');
        }

    } catch (error) {
        console.log(error.message);
    }
}

//updating users
const updateUsers = async (req, res) => {
    try {
        const userData = await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mobile, is_verified: req.body.verify, is_blocked: req.body.status } });


        res.redirect('/admin/adminDashboard');

    } catch (error) {
        console.log(error.message);
    }
}

//deleting user
const deleteUser = async (req, res) => {
    try {
        const id = req.query.id;
        await User.deleteOne({ _id: id });

        res.redirect('/admin/adminDashboard');
    } catch (error) {
        console.log(error.message);
    }
}






module.exports = {
    loadLogin,
    verfiyLogin,
    loadHome,
    logout,
    adminDashboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUsers,
    deleteUser

}