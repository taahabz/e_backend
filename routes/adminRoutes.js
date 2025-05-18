const express=require("express");
const User=require("../models/User");
const {protect,admin}=require("../middleware/authMiddleware");
const router=express.Router();
//route get /api/admin/users
//desc /get all users(admin only)
//@access Private/admin
router.get("/",protect,admin,async(req,res)=>{
    try {
        const users=await User.find({});
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server error"});
        
    }
});

//routes post/api/admin/users
//desc add a new user (admin only)
//private/ admin
router.post("/",protect,admin,async(req,res)=>{
    const{name,email,password,role}=req.body;
    try {
        let user =await User.findOne({email});
        if(user){
            return res.status(400).json({message:"User already exists"});

        }
        user =new User({
            name,
            email,
            password,
            role:role|| "customer",
        });
        await user.save();
        res.status(201).json({message:"User created successfully",user});
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server error"});
        
    }
});

//admin change the user details like name email role
//route PUT /api/admin/users/:id 


router.put("/:id",protect,admin,async(req,res)=>{
    try {
        const user=await User.findById(req.params.id);
        if(user){
            user.name=req.body.name||user.name;
            user.email=req.body.email||user.email;
            user.role=req.body.role||user.role;
        }
        const updatedUser=await user.save();
        res.json({message:"user updated successfully",user: updatedUser});
   } catch (error) {
        console.error(error);
        res.status(500).json({message:"server error"});
    }
});

//route delete /api/ admin/users
//dlete user

router.delete("/:id",protect,admin,async(req,res)=>{
    try {
        const user=await User.findById(req.params.id);
        if(user){
            await user.deleteOne();
            res.json({message:"user deleted successfully"});

        }else{
            res.status(404).json({message:"user not found"});
        }
    } catch (error) {
            console.error(error);
            res.status(500).json({message:"Server error"});
    }
});
module.exports=router;