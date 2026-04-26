import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "../models/User.js";

dotenv.config();

export const register = async (req, res) => {
  const { name, email, password, preferred_language, preferred_mode } =
    req.body;

  try {
    if (
      !name ||
      !email ||
      !password ||
      !preferred_language ||
      !preferred_mode
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      preferred_language,
      preferred_mode,
    });

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        preferred_language: newUser.preferred_language,
        preferred_mode: newUser.preferred_mode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", errorr: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("working");

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferred_language: user.preferred_language,
        preferred_mode: user.preferred_mode,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", mm: error.message });
  }
};
