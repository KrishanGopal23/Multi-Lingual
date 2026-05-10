import express from "express";
import dotenv from "dotenv";
import connectDB from "./modules/config/db.js";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";


dotenv.config();

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
  max: 1200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/mlc", (req, res, next) => {
  if (req.path === "/user/preferences") {
    return next();
  }
  return apiLimiter(req, res, next);
});

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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },
});

const userSockets = new Map();

io.on("connection", (socket) => {
  socket.on("auth", ({ userId }) => {
    if (!userId) {
      return;
    }
    userSockets.set(userId, socket.id);
    socket.data.userId = userId;
  });

  socket.on("call:offer", ({ to, from, sdp, mediaType }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call:offer", { from, sdp, mediaType });
    }
  });

  socket.on("call:answer", ({ to, from, sdp }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call:answer", { from, sdp });
    }
  });

  socket.on("call:ice", ({ to, from, candidate }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call:ice", { from, candidate });
    }
  });

  socket.on("call:end", ({ to, from, reason }) => {
    const targetSocket = userSockets.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call:end", { from, reason });
    }
  });

  socket.on("disconnect", () => {
    const userId = socket.data?.userId;
    if (userId && userSockets.get(userId) === socket.id) {
      userSockets.delete(userId);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
