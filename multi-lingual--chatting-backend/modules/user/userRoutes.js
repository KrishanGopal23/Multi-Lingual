import express from "express";
import {
	getProfile,
	addFriends,
	getFriends,
	getUsers,
	heartbeatPresence,
	setOfflinePresence,
	getPresence,
	subscribePush,
	unsubscribePush,
	updatePreferences,
} from "./userController.js";
import {protect} from "../middleware/authMiddleware.js";

const Router = express.Router();

Router.get('/profile', protect, getProfile);
Router.get('/users', protect, getUsers);
Router.post('/add/:friend_id',protect, addFriends);
Router.get('/friends',protect, getFriends);
Router.post('/presence/heartbeat', protect, heartbeatPresence);
Router.post('/presence/offline', protect, setOfflinePresence);
Router.get('/presence/:friend_id', protect, getPresence);
Router.post('/push/subscribe', protect, subscribePush);
Router.post('/push/unsubscribe', protect, unsubscribePush);
Router.patch('/preferences', protect, updatePreferences);

export default Router;
