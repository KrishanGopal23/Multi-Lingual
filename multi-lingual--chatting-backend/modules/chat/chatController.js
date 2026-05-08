import { User } from "../models/User.js";
import { Message } from "../models/Message.js";
import { translateText } from "../services/LangTranslateApi.js";
import { sendPushToUser } from "../services/PushService.js";

const shouldTranslateForUsers = (sender, receiver) => {
  const senderDisabled = sender?.multilingual_enabled === false;
  const receiverDisabled = receiver?.multilingual_enabled === false;
  return !(senderDisabled && receiverDisabled);
};

const sendMessages = async (req, res) => {
  let sender;
  let receiver;
  let original_message = "";
  let shouldPush = false;

  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;

    const { message, input_mode = "Text", reply_to = null } = req.body;

    if (!user_id || !friend_id) {
      return res.status(400).json({ message: "Invalid users" });
    }

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: "Message too long" });
    }

    const normalizedInputMode = input_mode === "Audio" ? "Audio" : "Text";

    [sender, receiver] = await Promise.all([
      User.findById(user_id).select(
        "preferred_language preferred_mode multilingual_enabled name",
      ),
      User.findById(friend_id).select(
        "preferred_language preferred_mode multilingual_enabled name",
      ),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    original_message = message;
    const translateForReceiver = shouldTranslateForUsers(sender, receiver);
    const targetLanguage = translateForReceiver
      ? receiver.preferred_language
      : sender.preferred_language;
    const translated_message = translateForReceiver
      ? await translateText(message, receiver.preferred_language)
      : message;

    const msg = await Message.create({
      sendar: user_id,
      receiver: friend_id,
      original_message,
      translated_message,
      input_mode: normalizedInputMode,
      sender_language: sender.preferred_language || "en",
      receiver_language: targetLanguage || "en",
      receiver_mode: receiver.preferred_mode || "Text",
      reply_to,
    });

    shouldPush = true;

    return res.status(200).json({
      message: "message sent successfully",
      data: msg,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  } finally {
    if (receiver && sender && shouldPush) {
      const preview = original_message?.trim() || "New message";
      const user_id = req.user?._id?.toString();
      const friend_id = req.params.friend_id;

      if (user_id && friend_id) {
        await sendPushToUser(friend_id, {
          title: sender?.name || "New message",
          body: preview.slice(0, 140),
          data: { friendId: user_id, url: "/chat" },
        });
      }
    }
  }
};

const sendMediaMessage = async (req, res) => {
  let sender;
  let receiver;
  let original_message = "";
  let attachments = [];
  let shouldPush = false;

  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;
    const { message = "", reply_to = null } = req.body;

    if (!user_id || !friend_id) {
      return res.status(400).json({ message: "Invalid users" });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (!message.trim() && files.length === 0) {
      return res.status(400).json({ message: "Message or files required" });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: "Message too long" });
    }

    [sender, receiver] = await Promise.all([
      User.findById(user_id).select(
        "preferred_language preferred_mode multilingual_enabled name",
      ),
      User.findById(friend_id).select(
        "preferred_language preferred_mode multilingual_enabled name",
      ),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    original_message = message.trim();
    const translateForReceiver = shouldTranslateForUsers(sender, receiver);
    const targetLanguage = translateForReceiver
      ? receiver.preferred_language
      : sender.preferred_language;
    const translated_message = original_message
      ? translateForReceiver
        ? await translateText(original_message, receiver.preferred_language)
        : original_message
      : "";

    attachments = files.map((file) => {
      const mimeType = file.mimetype || "";
      const kind = mimeType.startsWith("image/")
        ? "image"
        : mimeType.startsWith("video/")
          ? "video"
          : mimeType.startsWith("audio/")
            ? "audio"
            : "file";

      return {
        url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
        file_name: file.originalname,
        mime_type: mimeType,
        size: file.size || 0,
        kind,
      };
    });

    const msg = await Message.create({
      sendar: user_id,
      receiver: friend_id,
      original_message,
      translated_message,
      input_mode: "Media",
      sender_language: sender.preferred_language || "en",
      receiver_language: targetLanguage || "en",
      receiver_mode: receiver.preferred_mode || "Text",
      reply_to,
      attachments,
    });

    shouldPush = true;

    return res.status(200).json({
      message: "media message sent successfully",
      data: msg,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  } finally {
    if (receiver && sender && shouldPush) {
      const preview = original_message?.trim()
        ? original_message.trim()
        : `Sent ${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`;
      const user_id = req.user?._id?.toString();
      const friend_id = req.params.friend_id;

      if (user_id && friend_id) {
        await sendPushToUser(friend_id, {
          title: sender?.name || "New message",
          body: preview.slice(0, 140),
          data: { friendId: user_id, url: "/chat" },
        });
      }
    }
  }
};

const getMessages = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;

    if (!user_id || !friend_id) {
      return res.status(400).json({ message: "Invalid users" });
    }

    await Message.updateMany(
      {
        sendar: friend_id,
        receiver: user_id,
        status: { $in: ["sent", null] },
      },
      {
        $set: {
          status: "delivered",
          delivered_at: new Date(),
        },
      },
    );

    const messages = await Message.find({
      $or: [
        { sendar: user_id, receiver: friend_id },
        { sendar: friend_id, receiver: user_id },
      ],
      deleted_for: { $ne: user_id },
    })
      .populate(
        "reply_to",
        "sendar original_message translated_message deleted_for_all input_mode sender_language receiver_language",
      )
      .sort({ timestamp: 1, _id: 1 });

    return res.status(200).json({ message: messages });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const searchChatMessages = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;
    const query = (req.query.q || "").trim();
    const mediaKind = (req.query.media_kind || "all").trim().toLowerCase();

    if (!user_id || !friend_id) {
      return res.status(400).json({ message: "Invalid users" });
    }

    const filters = {
      $or: [
        { sendar: user_id, receiver: friend_id },
        { sendar: friend_id, receiver: user_id },
      ],
      deleted_for: { $ne: user_id },
      deleted_for_all: { $ne: true },
    };

    if (query) {
      const regex = new RegExp(query, "i");
      filters.$or = [
        { sendar: user_id, receiver: friend_id },
        { sendar: friend_id, receiver: user_id },
      ];
      filters.$and = [
        {
          $or: [{ original_message: regex }, { translated_message: regex }],
        },
      ];
    }

    if (mediaKind !== "all") {
      if (mediaKind === "media") {
        filters["attachments.0"] = { $exists: true };
      } else {
        filters["attachments.kind"] = mediaKind;
      }
    }

    const messages = await Message.find(filters)
      .populate(
        "reply_to",
        "sendar original_message translated_message deleted_for_all input_mode sender_language receiver_language",
      )
      .sort({ timestamp: -1, _id: -1 })
      .limit(100);

    return res.status(200).json({ message: messages });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const searchGlobalMessages = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const query = (req.query.q || "").trim();
    const mediaKind = (req.query.media_kind || "all").trim().toLowerCase();

    if (!user_id) {
      return res.status(400).json({ message: "Invalid user" });
    }

    const filters = {
      $or: [{ sendar: user_id }, { receiver: user_id }],
      deleted_for: { $ne: user_id },
      deleted_for_all: { $ne: true },
    };

    if (query) {
      const regex = new RegExp(query, "i");
      filters.$and = [
        {
          $or: [{ original_message: regex }, { translated_message: regex }],
        },
      ];
    }

    if (mediaKind !== "all") {
      if (mediaKind === "media") {
        filters["attachments.0"] = { $exists: true };
      } else {
        filters["attachments.kind"] = mediaKind;
      }
    }

    const messages = await Message.find(filters)
      .populate("sendar", "_id name")
      .populate("receiver", "_id name")
      .sort({ timestamp: -1, _id: -1 })
      .limit(100);

    const results = messages.map((message) => {
      const isSender = message.sendar?._id?.toString() === user_id;
      const friend = isSender ? message.receiver : message.sendar;

      return {
        message,
        friend: friend
          ? {
              id: friend._id,
              name: friend.name,
            }
          : null,
      };
    });

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const markMessagesRead = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;

    if (!user_id || !friend_id) {
      return res.status(400).json({ message: "Invalid users" });
    }

    const result = await Message.updateMany(
      {
        sendar: friend_id,
        receiver: user_id,
        status: { $ne: "read" },
      },
      {
        $set: {
          status: "read",
          read_at: new Date(),
        },
      },
    );

    return res.status(200).json({
      message: "messages marked as read",
      modified: result.modifiedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const setTypingStatus = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;
    const { is_typing } = req.body;

    if (!user_id || !friend_id) {
      return res.status(400).json({ message: "Invalid users" });
    }

    const typingUntil = is_typing ? new Date(Date.now() + 5000) : null;

    await User.findByIdAndUpdate(user_id, {
      typing_to: is_typing ? friend_id : null,
      typing_until: typingUntil,
    });

    return res.status(200).json({ message: "typing status updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getTypingStatus = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;

    if (!user_id || !friend_id) {
      return res.status(400).json({ message: "Invalid users" });
    }

    const friend = await User.findById(friend_id).select(
      "typing_to typing_until",
    );

    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = Date.now();
    const typingUntil = friend.typing_until
      ? new Date(friend.typing_until).getTime()
      : 0;
    const isTyping =
      friend.typing_to?.toString() === user_id && typingUntil > now;

    return res.status(200).json({
      is_typing: isTyping,
      expires_at: friend.typing_until,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const editMessage = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const message_id = req.params.message_id;
    const { message } = req.body;

    if (!message_id || !message) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const existing = await Message.findById(message_id);

    if (!existing) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isParticipant =
      existing.sendar.toString() === user_id ||
      existing.receiver.toString() === user_id;

    if (!isParticipant) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (existing.deleted_for_all) {
      return res.status(400).json({ message: "Message was deleted" });
    }

    if (existing.sendar.toString() !== user_id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (existing.deleted_for_all) {
      return res.status(400).json({ message: "Message was deleted" });
    }

    const [receiver, sender] = await Promise.all([
      User.findById(existing.receiver).select(
        "preferred_language preferred_mode multilingual_enabled",
      ),
      User.findById(existing.sendar).select(
        "preferred_language multilingual_enabled",
      ),
    ]);

    const translateForReceiver = shouldTranslateForUsers(sender, receiver);
    const targetLanguage = translateForReceiver
      ? receiver?.preferred_language
      : sender?.preferred_language;
    const translated_message = translateForReceiver
      ? await translateText(
          message,
          receiver?.preferred_language || existing.receiver_language || "en",
        )
      : message;

    existing.original_message = message;
    existing.translated_message = translated_message;
    existing.receiver_language = targetLanguage || existing.receiver_language;
    existing.receiver_mode =
      receiver?.preferred_mode || existing.receiver_mode || "Text";
    existing.edited_at = new Date();
    await existing.save();

    return res.status(200).json({ message: "message updated", data: existing });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const message_id = req.params.message_id;
    const { scope = "me" } = req.body;

    if (!message_id) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const existing = await Message.findById(message_id);

    if (!existing) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isParticipant =
      existing.sendar.toString() === user_id ||
      existing.receiver.toString() === user_id;

    if (!isParticipant) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (existing.deleted_for_all) {
      return res.status(400).json({ message: "Message was deleted" });
    }

    if (scope === "everyone") {
      if (existing.sendar.toString() !== user_id) {
        return res.status(403).json({ message: "Not allowed" });
      }

      existing.deleted_for_all = true;
      existing.edited_at = null;
      await existing.save();
      return res.status(200).json({ message: "message deleted for everyone" });
    }

    if (!existing.deleted_for) {
      existing.deleted_for = [];
    }

    const alreadyDeleted = existing.deleted_for
      .map((item) => item.toString())
      .includes(user_id);

    if (!alreadyDeleted) {
      existing.deleted_for.push(user_id);
      await existing.save();
    }

    return res.status(200).json({ message: "message deleted for you" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const reactToMessage = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const message_id = req.params.message_id;
    const { emoji } = req.body;

    if (!message_id || !emoji) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const existing = await Message.findById(message_id);

    if (!existing) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isParticipant =
      existing.sendar.toString() === user_id ||
      existing.receiver.toString() === user_id;

    if (!isParticipant) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (!existing.reactions) {
      existing.reactions = [];
    }

    const currentIndex = existing.reactions.findIndex(
      (reaction) => reaction.user?.toString() === user_id,
    );

    if (currentIndex >= 0) {
      if (existing.reactions[currentIndex].emoji === emoji) {
        existing.reactions.splice(currentIndex, 1);
      } else {
        existing.reactions[currentIndex].emoji = emoji;
      }
    } else {
      existing.reactions.push({ user: user_id, emoji });
    }

    await existing.save();

    return res.status(200).json({ message: "reaction updated", data: existing });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const forwardMessage = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;
    const { message_id } = req.body;

    if (!message_id || !friend_id) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const source = await Message.findById(message_id);
    if (!source) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (source.deleted_for_all) {
      return res.status(400).json({ message: "Message was deleted" });
    }

    const isParticipant =
      source.sendar.toString() === user_id ||
      source.receiver.toString() === user_id;

    if (!isParticipant) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(user_id).select(
        "preferred_language preferred_mode multilingual_enabled",
      ),
      User.findById(friend_id).select(
        "preferred_language preferred_mode multilingual_enabled",
      ),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const original_message = source.original_message || "";
    const translateForReceiver = shouldTranslateForUsers(sender, receiver);
    const targetLanguage = translateForReceiver
      ? receiver.preferred_language
      : sender.preferred_language;
    const translated_message = translateForReceiver
      ? await translateText(original_message, receiver.preferred_language)
      : original_message;

    const msg = await Message.create({
      sendar: user_id,
      receiver: friend_id,
      original_message,
      translated_message,
      input_mode: source.input_mode || "Text",
      sender_language: sender.preferred_language || "en",
      receiver_language: targetLanguage || "en",
      receiver_mode: receiver.preferred_mode || "Text",
      forwarded_from: source._id,
    });

    return res.status(200).json({ message: "message forwarded", data: msg });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export {
  sendMessages,
  sendMediaMessage,
  getMessages,
  searchChatMessages,
  searchGlobalMessages,
  markMessagesRead,
  setTypingStatus,
  getTypingStatus,
  editMessage,
  deleteMessage,
  reactToMessage,
  forwardMessage,
};
