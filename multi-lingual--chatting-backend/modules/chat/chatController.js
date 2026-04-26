import { User } from "../models/User.js";
import { Message } from "../models/Message.js";
import { translateText } from "../services/LangTranslateApi.js";

const sendMessages = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;

    const { message, input_mode = "Text" } = req.body;

    if (!user_id || !friend_id) {
      return res.status(400).json({ message: "Invalid users" });
    }

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const normalizedInputMode = input_mode === "Audio" ? "Audio" : "Text";

    const [sender, receiver] = await Promise.all([
      User.findById(user_id).select("preferred_language"),
      User.findById(friend_id).select("preferred_language"),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const original_message = message;
    const translated_message = await translateText(
      message,
      receiver.preferred_language
    );

    const msg = await Message.create({
      sendar: user_id,
      receiver: friend_id,
      original_message,
      translated_message,
      input_mode: normalizedInputMode,
      sender_language: sender.preferred_language || "en",
      receiver_language: receiver.preferred_language || "en",
    });

    return res.status(200).json({
      message: "message sent successfully",
      data: msg,
    });
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
    }).sort({ timestamp: 1, _id: 1 });

    return res.status(200).json({ message: messages });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { sendMessages, getMessages };
