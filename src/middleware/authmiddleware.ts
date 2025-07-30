import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is not defined in .env");
}

export const UserMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"];

    if (!header) {
          res.status(401).json({
            msg: "No token provided"
        });
        return;
    }

    try {
        const decoded = jwt.verify(header as string, JWT_SECRET);
        // @ts-ignore
          req.userId = decoded._id;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
              res.status(401).json({
                msg: "Invalid token"
                
            });
            return;
        } else if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                msg: "Token has expired"
            });
            return;
        } else {
            res.status(401).json({
                msg: "Authentication failed"
            });
            return;
        }
    }
};