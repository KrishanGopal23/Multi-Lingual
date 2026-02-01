import express from "express";
import { welcome, addFriends , getFriends} from "./userController.js";
import {protect} from "../middleware/authMiddleware.js";

const Router = express.Router();

Router.get('/profile', protect, welcome);
Router.post('/add/:friend_id',protect, addFriends);
Router.get('/friends',protect, getFriends);

export default Router;