import express from "express";
import { sendMessages, getMessages } from "./chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const Router = express.Router();

Router.post('/:friend_id/send',protect, sendMessages);
Router.get('/:friend_id', protect, getMessages)

export default Router;