import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import rateLimit from "express-rate-limit";
import {
	sendMessages,
	getMessages,
	markMessagesRead,
	setTypingStatus,
	getTypingStatus,
	sendMediaMessage,
	searchChatMessages,
	searchGlobalMessages,
	editMessage,
	deleteMessage,
	reactToMessage,
	forwardMessage,
} from "./chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const Router = express.Router();

const uploadDirectory = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDirectory)) {
	fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadDirectory);
	},
	filename: (_req, file, cb) => {
		const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "-");
		cb(null, `${Date.now()}-${safeName}`);
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 25 * 1024 * 1024 },
});

const sendLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
});

const typingLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 120,
	standardHeaders: true,
	legacyHeaders: false,
});

Router.post('/:friend_id/send', protect, sendLimiter, sendMessages);
Router.post('/:friend_id/media', protect, sendLimiter, upload.array("files", 6), sendMediaMessage);
Router.get('/search', protect, searchGlobalMessages)
Router.get('/:friend_id/search', protect, searchChatMessages)
Router.get('/:friend_id', protect, getMessages)
Router.post('/:friend_id/read', protect, markMessagesRead)
Router.post('/:friend_id/typing', protect, typingLimiter, setTypingStatus)
Router.get('/:friend_id/typing', protect, getTypingStatus)
Router.patch('/message/:message_id/edit', protect, editMessage)
Router.post('/message/:message_id/delete', protect, deleteMessage)
Router.post('/message/:message_id/react', protect, reactToMessage)
Router.post('/:friend_id/forward', protect, forwardMessage)

export default Router;