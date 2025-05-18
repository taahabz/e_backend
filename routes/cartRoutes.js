// routes/cartRoutes.js

const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// helper to load a cart document by userId or guestId
const getCart = async (userId, guestId) => {
  if (userId) {
    return await Cart.findOne({ user: userId });
  } else if (guestId) {
    return await Cart.findOne({ guestId });
  }
  return null;
};

// @route   POST /api/cart
// @desc    Add a product to the cart for a guest or logged-in user
// @access  Public
router.post("/", async (req, res) => {
  const { productId, quantity , size, color, guestId, userId } = req.body;

  try {
    // 1) verify product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 2) load or create cart
    let cart = await getCart(userId, guestId);
    if (cart) {
        const productIndex=cart.products.findIndex(
            (p)=>
        p.productId.toString()===productId&&
        p.size===size&& 
        p.color===color
        );
        if(productIndex>-1){
            //product already exists
            cart.products[productIndex].quantity+=quantity;
        }else{
            //add new product
            cart.products.push({
                productId,
                name:product.name,
                image:product.images[0].url,
                price:product.price,
                size,
                color,
                quantity
        });
            }
            //recalculate the total price
            cart.totalPrice=cart.products.reduce(
                (acc,item)=>acc+item.price *item.quantity,
            0
        );
        await cart.save();
        return res.status(200).json(cart);
        } else{
            //create new cart
                const newCart=await Cart.create({
                    userId:userId?userId:undefined,
                    guestId:guestId?guestId:"guest_"+new Date().getTime(),
                    products:[
                        {
                            productId,
                            name:product.name,
                            image:product.images[0].url,
                            price:product.price,
                            size,
                            color,
                            quantity,
                        },
                    ],
                    totalPrice:product.price*quantity,
                });
                return res.status(201).json(newCart);
            


        }
    }catch(error){

        console.error(error);
        res.status(500).json({message:"Server error"});
    }
});


//routes PUT  /api/cart
//desc update product quantity in the cart for a guest or logged in user
router.put("/",async(req,res)=>{
    const{productId,quantity,size,color,guestId,userId}=req.body;
    try{
        let cart=await getCart(userId,guestId);
        if(!cart)return res.status(404).json({message:"Cart not found"});
        const productIndex=cart.products.findIndex(
            (p)=>
                p.productId.toString()===productId&&
            p.size===size&&
            p.color===color
        );
            if(productIndex>-1){
                //update product
                if(quantity>0){
                    cart.products[productIndex].quantity=quantity;
                }else{
                    cart.products.splice(productIndex,1); //remove product if quantity is 0
                }
                cart.totalPrice=cart.products.reduce(
                    (acc,item)=>acc+item.price*item.quantity,
                0
            );
            await cart.save();
            return res.status(200).json(cart);
            }else{
                return res.status(404).json({message:"Product not found in cart"});
            }
    }catch(error){
        console.error(error);
        return res.status(500).json({message:"Server error"});
    }
    
});

// route delete /api/cart
//desc remove products from cart
//access public
router.delete("/",async(req,res)=>{
   const{productId,size,color,guestId,userId}=req.body;
   try {
    let cart=await getCart(userId,guestId);
    if(!cart) return res.status(404).json({message:"cart not found"});
    const productIndex=cart.products.findIndex(
        (p)=>p.productId.toString()===productId && p.size===size&&p.color===color);
        if(productIndex>-1){
            cart.products.splice(productIndex,1);
            cart.totalPrice=cart.products.reduce((acc,item)=>acc+item.price*item.quantity,0);
            await cart.save();
            return res.status(200).json(cart);
        }else{
            return res.status(404).json({message:"Product not found in the cart"});
        }
   } catch (error) {
    console.error(error);
    return res.status(500).json({message:"server error"});

    
   }
});

//route get/api/cart
//desc get logged in user or guest user cart
//access public
router.get("/",async(req,res)=>{
    const {userId,guestId}=req.query;
    try {
        const cart=await getCart(userId,guestId);
        if(cart){
            res.json(cart);

        }else{
            res.status(404).json({message:"Cart not found"})
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server error"});
    }

});

//route POST /api/cart/merge
//desc merge guest cart into uset cart on login
router.post("/merge",protect,async(req,res)=>{
    const{guestId}=req.body;
    try {
        //find the guest cart and the user cart
        const guestCart=await Cart.findOne({guestId});
        const userCart=await Cart.findOne({user:req.user._id});
        if(guestCart){
            if(guestCart.products.length===0){
                return res.status(400).json({message:"Guest cart is empty"});
            }
            if(userCart){
                //merge guest cart into user cart
                guestCart.products.forEach((guestItem)=>{
                    const productIndex=userCart.products.findIndex(
                        (item)=>
                        item.productId.toString()===guestItem.productId.toString()&&
                        item.size===guestItem.size&&
                        item.color===guestItem.color
                    );
                    if(productIndex>-1){
                        // if the item exist in the cart then update the quantity
                        userCart.products[productIndex].quantity+=guestItem.quantity;
                    }else{
                        userCart.products.push(guestItems);
                    }
                });
                userCart.totalPrice=userCart.products.reduce((acc,item)=>acc+item.price*item.quantity,
                0
            );
            await userCart.save();
            //remove the guest cart after merging
            try {
                await Cart.findOneAndDelete({guestId});
            } catch (error) {
                console.error("Error deleting the guest cart",error);

            }
            res.status(200).json(userCarat);
            }else{
                //if the user has no existing cart , assign the guest cart to the user
                guestCart.user=req.user._id;
                guestCart.guestId=undefined;
                await guestCart.save();
                res.status(200).json(guestCart);
            }
        }else{
            if(userCart){
                //guest cart has already been merged , return user cart
                return res.status(200).json(userCart);
            }
            res.status(404).json({message:"guest cart not found"});
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Server Error"});
        
    }
})


module.exports=router;




