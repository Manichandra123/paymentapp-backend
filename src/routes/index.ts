import express from "express";
const router = express.Router();
import userroute from "./user"
import accountroute from "./account"
router.use("/user" ,userroute );
router.use("/accounts" ,accountroute )


export default router;