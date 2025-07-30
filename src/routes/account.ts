import express from "express";
import mongoose from "mongoose";
import { UserMiddleware } from "../middleware/authmiddleware";
import { AccountModel } from "../db";
import z, { number, string, ZodNumber } from "zod";
const router = express.Router();

router.get("/checkbalance" , UserMiddleware,async(req ,res)=>{
    //@ts-ignore
    const userId = req.userId;
    if(!userId){
        res.status(400).json({
            msg:"user not found"
        })
    }
    const account = await AccountModel.findOne({userId}).populate("userId");
    
    if( account){
        res.status(200).json({
            msg:"your balance ",
           balance:account.balance
        })
    }
});
router.post("/transfer", UserMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    const session = await mongoose.startSession();

    session.startTransaction();
    const { amount, to } = req.body;

    // Fetch the accounts within the transaction
    const account = await AccountModel.findOne({ userId: userId }).session(session);

    if (!account || account.balance < amount) {
        await session.abortTransaction();
        res.status(400).json({
            message: "Insufficient balance"
        });
    }

    const toAccount = await AccountModel.findOne({ userId: to }).session(session);

    if (!toAccount) {
        await session.abortTransaction();
        res.status(400).json({
            message: "Invalid account"
        });
        return;
    }

    // Perform the transfer
    await AccountModel.updateOne({ userId: userId }, { $inc: { balance: -amount } }).session(session);
    await AccountModel.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

    // Commit the transaction
    await session.commitTransaction();
    res.json({
        message: "Transfer successful"
    });
});

export default router;