import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import Router  from "./routes/index"
import cors from "cors";
 
 
const app = express()
 
dotenv.config();
app.use(express.json());
app.use(cors())
app.use("/api/v1" , Router);

 


async function main() {
  await mongoose.connect(process.env.MONGODB_URL as string );
  app.listen(process.env.PORT , async () => {
    console.log(`you are listed on port :${process.env.PORT}`);
  });
}
main();