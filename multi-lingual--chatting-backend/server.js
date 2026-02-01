import express from "express";
import dotenv from "dotenv";
import connectDB from "./modules/config/db.js";
import mongoose from "mongoose";
import cors from "cors";


// app initialization
const app = express();

app.use(cors());

dotenv.config();
connectDB();

app.use(express.json());

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

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
