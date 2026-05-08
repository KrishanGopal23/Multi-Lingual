import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sendar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    original_message: {
        type: String,
        default: "",
    },
    translated_message: {
        type: String,
        default: "",
    },
    input_mode: {
        type: String,
        enum: ["Text", "Audio", "Media"],
        default: "Text",
    },
    sender_language: {
        type: String,
        default: "en",
    },
    receiver_language: {
        type: String,
        default: "en",
    },
    receiver_mode: {
        type: String,
        enum: ["Text", "Audio", "None"],
        default: "Text",
    },
    attachments: [
        {
            url: { type: String, default: "" },
            file_name: { type: String, default: "" },
            mime_type: { type: String, default: "" },
            size: { type: Number, default: 0 },
            kind: {
                type: String,
                enum: ["image", "video", "audio", "file"],
                default: "file",
            },
        },
    ],
    reply_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },
    forwarded_from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },
    edited_at: {
        type: Date,
        default: null,
    },
    deleted_for_all: {
        type: Boolean,
        default: false,
    },
    deleted_for: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    reactions: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            emoji: {
                type: String,
            },
        },
    ],
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
    },
    delivered_at: {
        type: Date,
        default: null,
    },
    read_at: {
        type: Date,
        default: null,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

export const Message = mongoose.model('Message', messageSchema);    
