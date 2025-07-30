import mongoose, { model, Schema } from "mongoose";
import { number } from "zod";

const UserSchema = new Schema({
    username: {type:String ,max:(20) , require:true , unique:true , trim:true},
    email:{type:String  ,require:true , trim:true},
    password:{type:String ,minLength: 6}
});
const AccountSchema = new Schema({
    userId:{
       type: mongoose.Schema.Types.ObjectId, // Reference to User model
        ref: 'User',
        required: true
    },
    balance:{
        type:Number,
        required: true
    }
});

export const AccountModel = model("Account" , AccountSchema);
export const UserModel = model("User" ,UserSchema);
