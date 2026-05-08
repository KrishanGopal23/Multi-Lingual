import express from "express";
import dotenv from "dotenv";
import connectDB from "./modules/config/db.js";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";


// app initialization
const app = express();

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

app.use(helmet());
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/mlc", apiLimiter);

dotenv.config();
connectDB();

app.use(express.json({ limit: "25mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// auth
import auth from "./modules/auth/authRoutes.js";
app.use("/mlc/auth/", auth);

// user
import user from "./modules/user/userRoutes.js";
app.use("/mlc/user/", user);

// chat
import chat from "./modules/chat/chatRoutes.js";
app.use("/mlc/chat/", chat);

// speech
import speech from "./modules/speech/speechRoutes.js";
app.use("/mlc/speech/", speech);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
