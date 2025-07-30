"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const db_1 = require("../db");
const authmiddleware_1 = require("../middleware/authmiddleware");
dotenv_1.default.config();
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("❌ JWT_SECRET is not defined in .env");
}
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const userSchema = zod_1.z.object({
        username: zod_1.z.string().min(5).max(30),
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8).max(16)
    });
    const validation = userSchema.safeParse({ username, email, password });
    if (!validation.success) {
        res.status(400).json({
            msg: "enter rignt input",
            errors: validation.error.errors
        });
    }
    const existinguser = yield db_1.UserModel.findOne({ username });
    if (existinguser) {
        res.status(400).json({
            msg: "user already exists"
        });
    }
    const hashedpassword = yield bcrypt_1.default.hash(password, 10);
    const user = yield db_1.UserModel.create({
        username,
        email,
        password: hashedpassword
    });
    const userId = user._id;
    yield db_1.AccountModel.create({
        userId,
        balance: 1 + Math.random() * 10000
    });
    if (user) {
        res.status(200).json({
            msg: "signed up"
        });
    }
    else {
        res.status(300).json({
            msg: "not signed in "
        });
    }
}));
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        // 🔒 Check inputs
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
            return;
        }
        // 🔍 Find user
        const userExists = yield db_1.UserModel.findOne({ email });
        if (!userExists) {
            res.status(400).json({
                success: false,
                message: "You're not signed up or worng details",
            });
            return;
        }
        // 🔑 Compare password
        const isMatch = yield bcrypt_1.default.compare(password, userExists.password);
        if (!isMatch) {
            res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
            return;
        }
        // 🔐 Sign JWT token
        const token = jsonwebtoken_1.default.sign({ _id: userExists._id }, JWT_SECRET, {
            expiresIn: '7d',
        });
        // ✅ Success
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
        });
    }
    catch (error) {
        console.error("Signin error:", error);
        res.status(400).json({
            success: false,
            message: "Internal server error",
        });
    }
}));
router.put("/updateusers", authmiddleware_1.UserMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    // @ts-ignore
    const userId = req.userId;
    console.log("Updating user:", userId);
    const hashedpassword = yield bcrypt_1.default.hash(password, 10);
    try {
        const updatedUser = yield db_1.UserModel.findByIdAndUpdate(userId, { $set: { email, password: hashedpassword } }, { new: true });
        if (!updatedUser) {
            res.status(404).json({ msg: "User not found" });
            return;
        }
        res.status(200).json({
            msg: "Updated user",
            user: updatedUser
        });
        return;
    }
    catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ msg: "Internal server error" });
    }
}));
router.get("/getusers", authmiddleware_1.UserMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userId;
        const users = yield db_1.UserModel.find({ _id: { $ne: userId } }).select("-password");
        res.status(200).json({
            success: true,
            users, // ✅ this will be an array
        });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
}));
exports.default = router;
