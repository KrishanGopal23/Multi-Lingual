import express from "express";
import { User } from "../models/User.js";
import { Message } from "../models/Message.js";
import { translateText } from "../services/LangTranslateApi.js";

const sendMessages = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;

    const message = req.body.message;

    if (!user_id || !friend_id) {
      return res.status(400).json({ message: "Invalid users" });
    }

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const friend_lang =
      await User.findById(friend_id).select("preferred_language");

      const original_message = message;
      const translated_message = await translateText(
        message,
        friend_lang.preferred_language
      );
    

    const msg = await Message.create({
      sendar: user_id,
      receiver: friend_id,
      original_message: original_message,
      translated_message: translated_message,
    });

    return res.status(200).json({ message: "message sent successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;

    if (!user_id || !friend_id) {
      return res.status(400).json({ message: "Invalid users" });
    }

    const messages = await Message.find({
      $or: [
        { sendar: user_id, receiver: friend_id },
        { sendar: friend_id, receiver: user_id },
      ],
    }).sort({ createdAt: 1 });

    if (messages.length === 0) {
      return res.status(400).json({ message: "No messages found" });
    }

    return res.status(200).json({ message: messages });
  } catch (error) {
    return res.status(500).json({ message: error.Message });
  }
};

export { sendMessages, getMessages };
