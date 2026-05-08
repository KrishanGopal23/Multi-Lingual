import { User } from "../models/User.js";

const getProfile = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const user = await User.findById(user_id.toString());

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
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
    return res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = await User.findById(userId).select("friends");

    const users = await User.find({
      _id: {
        $ne: userId,
        $nin: currentUser?.friends || [],
      },
    }).select("_id name preferred_language preferred_mode multilingual_enabled");

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addFriends = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const friend_id = req.params.friend_id;

    const user = await User.findById(user_id.toString());
    const friend = await User.findById(friend_id.toString());

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.friends.includes(friend_id) || friend.friends.includes(user_id)) {
      return res.status(400).json({ message: "Friend already added" });
    }

    user.friends.push(friend_id);
    friend.friends.push(user_id);

    await user.save();
    await friend.save();

    return res.json({ message: "Friend added successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getFriends = async (req, res) => {
  try {
    const user_id = req.user._id.toString();

    const user = await User.findById(user_id).populate(
      "friends",
      "name preferred_language preferred_mode multilingual_enabled",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user_friends: user.friends });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const heartbeatPresence = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const now = new Date();

    await User.findByIdAndUpdate(user_id, {
      is_online: true,
      last_seen: now,
    });

    return res.status(200).json({ message: "presence updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const setOfflinePresence = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const now = new Date();

    await User.findByIdAndUpdate(user_id, {
      is_online: false,
      last_seen: now,
      typing_to: null,
      typing_until: null,
    });

    return res.status(200).json({ message: "presence set offline" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPresence = async (req, res) => {
  try {
    const friend_id = req.params.friend_id;
    const friend = await User.findById(friend_id).select("is_online last_seen");

    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = Date.now();
    const lastSeenMs = friend.last_seen ? new Date(friend.last_seen).getTime() : 0;
    const isOnline = friend.is_online && lastSeenMs > now - 45000;

    return res.status(200).json({
      is_online: isOnline,
      last_seen: friend.last_seen,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const subscribePush = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const subscription = req.body;

    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return res.status(400).json({ message: "Invalid subscription" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const exists = user.push_subscriptions?.some(
      (item) => item.endpoint === subscription.endpoint,
    );

    if (!exists) {
      user.push_subscriptions = [...(user.push_subscriptions || []), subscription];
      await user.save();
    }

    return res.status(200).json({ message: "push subscription saved" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const unsubscribePush = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint is required" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.push_subscriptions = (user.push_subscriptions || []).filter(
      (item) => item.endpoint !== endpoint,
    );
    await user.save();

    return res.status(200).json({ message: "push subscription removed" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const user_id = req.user._id.toString();
    const { preferred_language, preferred_mode, multilingual_enabled } = req.body;

    const updates = {};

    if (preferred_language) {
      updates.preferred_language = preferred_language;
    }

    if (preferred_mode) {
      updates.preferred_mode = preferred_mode;
    }

    if (typeof multilingual_enabled === "boolean") {
      updates.multilingual_enabled = multilingual_enabled;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const user = await User.findByIdAndUpdate(
      user_id,
      { $set: updates },
      { new: true },
    ).select("_id name email preferred_language preferred_mode multilingual_enabled");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export {
  getProfile,
  getUsers,
  addFriends,
  getFriends,
  heartbeatPresence,
  setOfflinePresence,
  getPresence,
  subscribePush,
  unsubscribePush,
  updatePreferences,
};
