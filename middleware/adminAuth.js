const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){

            next();

        }else{
            res.redirect('/admin')
        }
       
        
    } catch (error) {
        console.log(error);
    }
    
}
const isLogout = async(req,res,next)=>{
    try {
        if(req.session.user_id){
            res.redirect('/admin/adminHome');
        } else {
            next();

        }
        
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}