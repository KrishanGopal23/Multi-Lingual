import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { generateSpeech, transcribeSpeech } from "./speechController.js";

const Router = express.Router();

Router.post("/tts", protect, generateSpeech);
Router.post("/stt", protect, transcribeSpeech);

export default Router;
