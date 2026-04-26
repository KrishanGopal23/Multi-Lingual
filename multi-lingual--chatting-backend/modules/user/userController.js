import { User } from "../models/User.js";


const getProfile = async (req, res) => {

    try {
        const user_id = req.user._id.toString();
        const user = await User.findById(user_id.toString());

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            preferred_language: user.preferred_language,
            preferred_mode: user.preferred_mode,
          },
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    // get logged-in user with friends
    const currentUser = await User.findById(userId).select("friends");

    // exclude:
    // 1. logged-in user
    // 2. user's friends
    const users = await User.find({
      _id: {
        $ne: userId,
        $nin: currentUser.friends
      }
    }).select("_id name preferred_language preferred_mode");

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

        res.json({ message: "Friend added successfully" });
    }
    
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getFriends = async (req, res) => {
    try {

        const user_id = req.user._id.toString();

        const user = await User.findById(user_id).populate(
          "friends",
          "name preferred_language preferred_mode"
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({user_friends: user.friends})

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export { getProfile, getUsers, addFriends, getFriends };
