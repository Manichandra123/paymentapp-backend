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
const mongoose_1 = __importDefault(require("mongoose"));
const authmiddleware_1 = require("../middleware/authmiddleware");
const db_1 = require("../db");
const router = express_1.default.Router();
router.get("/checkbalance", authmiddleware_1.UserMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    if (!userId) {
        res.status(400).json({
            msg: "user not found"
        });
    }
    const account = yield db_1.AccountModel.findOne({ userId }).populate("userId");
    if (account) {
        res.status(200).json({
            msg: "your balance ",
            balance: account.balance
        });
    }
}));
router.post("/transfer", authmiddleware_1.UserMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    const { amount, to } = req.body;
    // Fetch the accounts within the transaction
    const account = yield db_1.AccountModel.findOne({ userId: userId }).session(session);
    if (!account || account.balance < amount) {
        yield session.abortTransaction();
        res.status(400).json({
            message: "Insufficient balance"
        });
    }
    const toAccount = yield db_1.AccountModel.findOne({ userId: to }).session(session);
    if (!toAccount) {
        yield session.abortTransaction();
        res.status(400).json({
            message: "Invalid account"
        });
        return;
    }
    // Perform the transfer
    yield db_1.AccountModel.updateOne({ userId: userId }, { $inc: { balance: -amount } }).session(session);
    yield db_1.AccountModel.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);
    // Commit the transaction
    yield session.commitTransaction();
    res.json({
        message: "Transfer successful"
    });
}));
exports.default = router;
