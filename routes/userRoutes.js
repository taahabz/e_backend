const express=require("express");
const User= require("../models/User");
const jwt =require("jsonwebtoken");
const router=express.Router();
const {protect}=require("../middleware/authMiddleware");
 
//@post /api/users/register
//  desc register a new user  
//access public
router.post("/register",async(req,res)=>{
    const{name,email,password}=req.body;
    try{
       //registration logic
       let user = await User.findOne({email});
       if  (user) return res.status(400).json({message: "User already exists"});
       user =new User({ name, email, password});
       await user.save();
    // JWT 
    const payload={user:{id:user._id,role:user.role }};
    //sign and return the user data along with user data    
    jwt.sign(
        payload,process.env.JWT_SECRET,{expiresIn:"40h"},(err,token)=>{
         if(err) throw err;
         //send the user  and token in response 
         res.status(201).json({
            user:{
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role, 
            },
            token,
         });
    }
);
    }catch(error){
        console.log(error);
        res.status(500).send("Server error");
    }
});


//@ route POST /api/users/login
//@desc  Authenticate users
//access     public
router.post("/login", async (req,res)=>{
    const{email,password}=req.body;
    try{
let user=await User.findOne({email});
        if(!user) return res.status(400).json({message:"Invalid Credentials"}); 
        const isMatch=await user.matchPassword(password);
        if(!isMatch)return res.status(400).json({message:"invalid Credentials"});

 const payload={user:{id:user._id,role:user.role }};
    //sign and return the user data along with user data    
    jwt.sign(
        payload,process.env.JWT_SECRET,{expiresIn:"40h"},(err,token)=>{
         if(err) throw err;
         //send the user  and token in response 
         res.json({
            user:{
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role, 
            },
            token,
         });
    }
);



    }catch(err){
            console.log(error);
            res.status(500).send("Server Error "); 
    }
})



//@route GET/api/users/profile
//desc get logged in user's profile (protected route)
// access will be private 
router.get("/profile",protect,async(req,res)=>  {
    res.json(req.user);
})
module.exports=router;