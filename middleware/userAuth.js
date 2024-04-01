const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            next();
        }
        else{
          res.redirect('/')
        }
        
        
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
        
    }
}

const isLogout = async(req,res,next)=>{
    try {
        
        if(req.session.user_id){
            res.redirect('/dashboard');
        } else {
            next();

        }
       
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error" });
        
    }
}

module.exports = {
    isLogin,
    isLogout
}