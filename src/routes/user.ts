import express from "express";
import dotenv from 'dotenv';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { z} from "zod";
import { AccountModel, UserModel } from "../db";
import {UserMiddleware} from "../middleware/authmiddleware"

dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is not defined in .env");
}



router.post('/signup' , async(req, res)=>{
     const username = req.body.username;
     const email = req.body.email;
     const password = req.body.password;

    const userSchema = z.object({
         username: z.string().min(5).max(30),
         email :z.string().email(),
         password :z.string().min(8).max(16)
    });
 const validation = userSchema.safeParse({username , email , password});
    if(!validation.success){
        res.status(400).json({
            msg:"enter rignt input",
            errors: validation.error.errors
        })
    }

    const existinguser = await UserModel.findOne({username})
    if(existinguser){
        res.status(400).json({
            msg:"user already exists"
        })
    }
    const hashedpassword =  await bcrypt.hash(password , 10);
    
    const user = await UserModel.create({
        username,
        email,
        password:hashedpassword
    })
    const userId = user._id;
      await AccountModel.create({
        userId,
        balance: 1 + Math.random() * 10000
    });
    if(user){
        res.status(200).json({
            msg:"signed up"
        })
    }else{
        res.status(300).json({
            msg:"not signed in "
        })
    }
 
});

router.post('/signin', async(req, res) => {
  const { email, password } = req.body;
 

  try {
    // 🔒 Check inputs
    if (!email || !password) {
       res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return ;
    }

    // 🔍 Find user
    const userExists = await UserModel.findOne({ email });
    

    if (!userExists) {
    res.status(400).json({
        success: false,
        message: "You're not signed up or worng details",
      });
      return;
    }
 
    // 🔑 Compare password
    const isMatch = await bcrypt.compare(password, userExists.password as string);
   

    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // 🔐 Sign JWT token
    const token = jwt.sign({ _id: userExists._id }, JWT_SECRET ,{
      expiresIn: '7d',
    });
      

    // ✅ Success
     res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });

  } catch (error) {
    console.error("Signin error:", error);
     res.status(400).json({
      success: false,
      message: "Internal server error",
    });
  }
});
router.put("/updateusers", UserMiddleware, async (req, res) => {
  const { email, password } = req.body;
  // @ts-ignore
  const userId = req.userId;

  console.log("Updating user:", userId);
  const hashedpassword = await bcrypt.hash(password , 10);

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { email, password:hashedpassword } },
      { new: true }
    );

    if (!updatedUser) {
    res.status(404).json({ msg: "User not found" });
    return;
    }
     

    res.status(200).json({
      msg: "Updated user",
      user: updatedUser
       
    });
    return;
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
});
router.get("/getusers", UserMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.userId;

    const users = await UserModel.find({ _id: { $ne: userId } }).select("-password");

    res.status(200).json({
      success: true,
      users, // ✅ this will be an array
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

export default router;