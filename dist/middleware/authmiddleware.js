"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("❌ JWT_SECRET is not defined in .env");
}
const UserMiddleware = (req, res, next) => {
    const header = req.headers["authorization"];
    if (!header) {
        res.status(401).json({
            msg: "No token provided"
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(header, JWT_SECRET);
        // @ts-ignore
        req.userId = decoded._id;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                msg: "Invalid token"
            });
            return;
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                msg: "Token has expired"
            });
            return;
        }
        else {
            res.status(401).json({
                msg: "Authentication failed"
            });
            return;
        }
    }
};
exports.UserMiddleware = UserMiddleware;
