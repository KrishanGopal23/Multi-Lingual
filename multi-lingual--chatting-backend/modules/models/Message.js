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
        required: true,
    },
    translated_message: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

export const Message = mongoose.model('Message', messageSchema);    