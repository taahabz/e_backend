const express=require("express");
const Order=require("../models/Order");
const{protect}=require("../middleware/authMiddleware");
const router=express.Router();

//get/api/orders/my-orders
//desc get logged-in users's orders
// access private
router.get("/my-orders",protect,async(req,res)=>{
    try {
        //find orders for authenticated users
        const orders=await Order.find({user:req.user._id}).sort({
            createdAt:-1,
        }); //sort by recent orders
        res.json(orders);


        
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"server error"});
        
    }
});

//get/api/orders/:id
//get order details by id
//access private
router.get("/:id",protect,async(req,res)=>{
    try {
        const order=await Order.findById(req.params.id).populate(
            "user",
            "name email"
        );
        if(!order){
            return res.status(404).json({message:"order not found"});
        }
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"server error"});
        
    }
});
module.exports=router;