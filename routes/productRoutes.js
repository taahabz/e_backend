const express=require("express");
const Product=require("../models/Product");
const {protect,admin}=require("../middleware/authMiddleware");
const router=express.Router();
//route Post /api/products
//desc. Create a new product
//access Private/Admin
router.post("/",protect,admin,async(req,res)=>{
    try{
        const {
            name,
            description,
            price,
            discountPrice,
            countInStock,
            category,
            brand,
            sizes,
            colors,
            collections,
            material,
            gender,
            images,
            isFeatured,
            isPublished,
            tags,
            dimensions,
            weight,
            sku,
        }=req.body;
        const product=new Product( {
            name,
            description,
            price,
            discountPrice,
            countInStock,
            category,
            brand,
            sizes,
            colors,
            collections,
            material,
            gender,
            images,
            isFeatured,
            isPublished,
            tags,
            dimensions,
            weight,
            sku,
            user:req.user._id,   //reference to the admin who created it 
        });
        const createdProduct=await product.save();
        res.status(201).json(createdProduct);
    }catch (error) {
    console.error('🚨 Product save failed:', error);
    return res.status(500).send("Server error");
  }
});
//route PUT /api/products/:id
//desc. update an existing product id 
// access private /admin
router.put("/:id",protect ,admin,async(req,res)=>{
    try{
        const {
            name,
            description,
            price,
            discountPrice,
            countInStock,
            category,
            brand,
            sizes,
            colors,
            collections,
            material,
            gender,
            images,
            isFeatured,
            isPublished,
            tags,
            dimensions,
            weight,
            sku,
        }=req.body;
//find product by ID
const product =await Product.findById(req.params.id);
if(product){
    //update product fields
    product.name=name||product.name; //if name not changed go with the old name or use the updated name
     product.description=description||product.description; 
      product.price=price||product.price; 
       product.discountPrice=discountPrice||product.discountPrice; 
        product.countInStock=countInStock||product.countInStock
         product.category||product.category; 
          product.brand=brand||product.brand; 
           product.sizes=sizes||product.sizes; 
            product.colors=colors||product.colors; 
             product.collections=collections||product.collections; 
              product.material=material||product.material; 
               product.gender=gender||product.gender; 
                product.images=images||product.images; 
                 product.isFeatured=
                 isFeatured !==undefined?isFeatured:product.isFeatured; 
                  product.isPublished=
                  isPublished!==undefined?isPublished : product.isPublished; 
                   product.tags=tags||product.tags; 
                    product.dimensions=dimensions||product.dimensions; 
                     product.weight=weight||product.weight; 
                      product.sku=sku||product.sku; 
                      //save the updated product
        const updatedProduct=await product.save();
        res.json(updatedProduct);
}else{
    res.status(404).json({message:"Product not Found"});

}
    }catch(error){
        console.error(error);
        res.status(500).send("Server Error");
    }
});
//routes delete /api/products/:id
//desc delete a product by id
//access private/admin
router.delete("/:id",protect,admin,async(req,res)=>{
    try{
        const product=await Product.findById(req.params.id);
        if(product){
            //remove
            await product.deleteOne();
            res.json({message:"Product Removed"});
        }else{
            res.status(404).json({message:"Product not found"});
        }
    }catch(error){
            console.log(error);
                res.status(500).send("Server error");
            
}});

//route get/api/products
// desc get all products with optional query filters
// access public

router.get("/",async(req,res)=>{
    try{
        const {collection,size,color,gender,minPrice,maxPrice,
            sortBy,search,category,material,brand,limit}=req.query;
            let query={};
                //filter
                if(collection && collection.toLocaleLowerCase()!== "all"){
                    query.collections=collection;
                }
                  if(category &&category.toLocaleLowerCase()!== "all"){
                    query.category=category;
                }
                if(material){
                    query.material={$in:material.split(",")};
                }
                 if(brand){
                    query.brand={$in:brand.split(",")};
                }
                 if(size){
                    query.sizes={$in:size.split(",")};
                }
                 if(color){
                    query.colors={$in:[color]};
                }
                 if(gender){
                    query.gender=gender;
                }
                if(minPrice || maxPrice){
                    query.price={};
                    if(minPrice) query.price.$gte=Number(minPrice);
                      if(maxPrice) query.price.$lte=Number(maxPrice);
                }
                if(search){
                    query.$or=[
                        {name:{$regex:search,$options:"i"}},
                         {description:{$regex:search,$options:"i"}}
                    ];
                }
                //sorting logic
                let sort={};
                if(sortBy){
                    switch(sortBy){
                        case "priceAsc":
                            sort={price:1};
                            break;
                        case "priceDesc":
                            sort={price:-1};
                            break;
                        case "popularity":
                            sort={rating:-1};
                            break;   
                            default:
                                break; 
                    }
                }

    //fetch products and apply sorting and limit
    let products=await Product.find(query)
    .sort(sort)
    .limit(Number(limit)||0);
    res.json(products);
    }catch(error){
        console.error(error);
        res.status(500).send("server error");

    }
});



//GET /api/products/new-arrival
//desc retrieve latest 8 products-creation date
//access public
router.get("/new-arrivals",async(req,res)=>{
    try {
        const newArrivals= await Product.findOne().sort({created:-1}).limit(8);
        res.json(newArrivals);
    } catch (error) {
        console.error(error);
        res.status(500).send("server error");
    }
});


//desc reetrieve the product with highest ranking
//access public
router.get("/best-seller", async (req,res)=>{
    try {
        const bestSeller=await Product.findOne().sort({rating:-1});
        if(bestSeller){
        res.json(bestSeller);
        }else{
            res.status(404).json({message:"no best seller found"});
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).send("server error");
    }
});

//route get/api/products/:id
//get a single product by id
//access public
router.get("/:id",async(req,res)=>{
    try{
        const product=await Product.findById(req.params.id);
        if(product){
            res.json(product);

        }else{
            res.status(404).json({message:"Product not found"});
        }
    }catch(error){
        console.error(error);
        res.status(500).send("Server Error");
    }
})

//route get / api/products/similar/:id
// desc retrieve similar products based on the current products gender and category
//access public
router.get("/similar/:id",async(req,res)=>{
    const{id}=req.params;
    console.log(id);

try {
    const product=await Product.findById(id);
    if(!product){
    return res.status(404).json({message:"Product not found"});
}
const similarProducts= await Product.find({
    _id:{$ne:id},// exclude the current id
    gender:product.gender,
    category:product.category,
}).limit(4); //to show thee number of products
res.json(similarProducts);
} catch (error) {
    console.error(error);
    res.status(500).send("server error")
}
});

//
module.exports=router;