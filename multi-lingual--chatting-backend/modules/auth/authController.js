import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import crypto from "crypto";

dotenv.config();

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_DAYS = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30);
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: `${REFRESH_DAYS}d`,
  });

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const setRefreshCookie = (res, token) => {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
  });
};

export const register = async (req, res) => {
  const {
    name,
    email,
    password,
    preferred_language,
    preferred_mode,
    multilingual_enabled,
  } = req.body;

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
      multilingual_enabled:
        typeof multilingual_enabled === "boolean" ? multilingual_enabled : true,
    });

    const token = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);
    const refreshHash = hashToken(refreshToken);

    newUser.refresh_tokens = [
      {
        token_hash: refreshHash,
        expires_at: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
      },
    ];

    await newUser.save();
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        preferred_language: newUser.preferred_language,
        preferred_mode: newUser.preferred_mode,
        multilingual_enabled: newUser.multilingual_enabled,
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

    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const refreshHash = hashToken(refreshToken);

    const expiry = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
    const refreshTokens = (user.refresh_tokens || []).filter(
      (item) => item.expires_at && item.expires_at > new Date(),
    );
    refreshTokens.push({ token_hash: refreshHash, expires_at: expiry });
    user.refresh_tokens = refreshTokens;
    await user.save();
    setRefreshCookie(res, refreshToken);

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
        multilingual_enabled: user.multilingual_enabled,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", mm: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select(
      "refresh_tokens name email preferred_language preferred_mode multilingual_enabled",
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const refreshHash = hashToken(refreshToken);
    const matched = (user.refresh_tokens || []).find(
      (item) => item.token_hash === refreshHash,
    );

    if (!matched) {
      return res.status(401).json({ message: "Refresh token invalid" });
    }

    user.refresh_tokens = (user.refresh_tokens || []).filter(
      (item) => item.token_hash !== refreshHash,
    );

    const newRefreshToken = generateRefreshToken(user._id);
    const newRefreshHash = hashToken(newRefreshToken);
    const expiry = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);

    user.refresh_tokens.push({ token_hash: newRefreshHash, expires_at: expiry });
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    const accessToken = generateAccessToken(user._id);

    return res.status(200).json({
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferred_language: user.preferred_language,
        preferred_mode: user.preferred_mode,
        multilingual_enabled: user.multilingual_enabled,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Unable to refresh" });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      const refreshHash = hashToken(refreshToken);
      const decoded = jwt.decode(refreshToken);

      if (decoded?.userId) {
        const user = await User.findById(decoded.userId).select("refresh_tokens");
        if (user) {
          user.refresh_tokens = (user.refresh_tokens || []).filter(
            (item) => item.token_hash !== refreshHash,
          );
          await user.save();
        }
      }
    }

    res.clearCookie("refresh_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed" });
  }
};
