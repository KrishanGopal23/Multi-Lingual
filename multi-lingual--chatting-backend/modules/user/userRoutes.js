import express from "express";
import { getProfile, addFriends , getFriends, getUsers} from "./userController.js";
import {protect} from "../middleware/authMiddleware.js";

const Router = express.Router();

Router.get('/profile', protect, getProfile);
Router.get('/users', protect, getUsers);
Router.post('/add/:friend_id',protect, addFriends);
Router.get('/friends',protect, getFriends);

export default Router;
