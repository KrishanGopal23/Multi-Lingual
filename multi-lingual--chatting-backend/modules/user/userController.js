import express from "express";
import { User } from "../models/User.js";


const welcome = async (req, res) => {

    try {
        const user_id = req.user._id.toString();
        const user = await User.findById(user_id.toString());
        res.json({ message: "Welcome api is working fine" })

    } catch (error) {
        res.send(error);
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
    }).select("_id name");

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

        const user = await User.findById(user_id).populate("friends", "name ");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.friends.length === 0) {
            return res.status(404).json({ message: "No friends found" });
        }
        return res.status(200).json({user_friends: user.friends})

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export {welcome,getUsers, addFriends, getFriends};
