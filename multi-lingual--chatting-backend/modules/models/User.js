import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
    },

    password: {
      type: String,
      required: true,
      select: false, // 🔐 prevent leaks
    },

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    preferred_language: {
      type: String,
      default: "None",
    },

    preferred_mode: {
      type: String,
      default: "None",
    },

    multilingual_enabled: {
      type: Boolean,
      default: true,
    },

    is_online: {
      type: Boolean,
      default: false,
    },

    last_seen: {
      type: Date,
      default: null,
    },

    typing_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    typing_until: {
      type: Date,
      default: null,
    },

    push_subscriptions: [
      {
        endpoint: { type: String, default: "" },
        keys: {
          p256dh: { type: String, default: "" },
          auth: { type: String, default: "" },
        },
      },
    ],

    refresh_tokens: [
      {
        token_hash: { type: String, required: true },
        expires_at: { type: Date, required: true },
        created_at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
  
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema);
