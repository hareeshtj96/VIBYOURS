const User = require("../model/userModel");
const bcrypt = require("bcrypt");



//login page rendering
const loadLogin = async (req, res) => {
    console.log("loadlogin is working")
    try {
        res.render('adminLogin')
    } catch (error) {
        console.log(error);
    }
}

//verifying login
const verfiyLogin = async (req, res) => {
    console.log("verify login working")
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email});

        if(userData) {
            const passwordMatch = await bcrypt.compare(password,userData.password);


            if(passwordMatch) {
                
                if(userData.is_admin === 0 ){
                    res.render('adminLogin',{message: "You are not an admin"});

                }else {
                    req.session.user_id = userData._id;
                    res.redirect('/admin/adminDashboard');
                }
            } else {
                //incorrect password
                res.render('adminLogin',{message: "Email and Password is incorrect"});
            }
        }else{
            //user not found
            res.render('adminLogin', {message: "Email and Password are incorrect"})
        }
    } catch(error) {

        console.log('verify login',error.message);
    }

} 

//loading dashboard
const loadDashboard = async(req,res)=>{
    try {
       const userData = await User.findById({_id:req.session.user_id});
       //console.log(userData);
        res.render('adminDashboard',{admin:userData});
    } catch (error) {
        console.log("loaddashboard",error.message);
    }
}


//admin logout
const logout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin');
        
    } catch (error) {
        console.log('logout',error.message);
        
    }
}



module.exports = {
    loadLogin,
    verfiyLogin,
    loadDashboard,
    logout
}