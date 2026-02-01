import React from "react";
import { useState } from "react";
import { sendMessages } from "../services/api";

const Chat = ({ messages, friendId, onBack }) => {
  const [message, setMessage] = useState("");

  async function sendMessagesHandler() {
    try {
      if (message.trim() === "") {
        return;
      }
      await sendMessages(message, friendId);
      setMessage("");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#f0f2f5]">
      {/* Header */}
      <div className="bg-white h-16 shrink-0 flex justify-between items-center px-4 shadow-sm border-b border-gray-200 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
            {/* Placeholder for avatar if name isn't available in this component */}
            <span className="text-sm">User</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 leading-tight">Chat</h3>
            <span className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
            </span>
          </div>
        </div>
        <div className="flex gap-2 text-blue-600">
          <button className="p-2 hover:bg-blue-50 rounded-full transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </button>
          <button className="p-2 hover:bg-blue-50 rounded-full transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f9640.png')] bg-repeat bg-opacity-5">
        <ul className="space-y-4 flex flex-col">
          {messages && messages.length > 0 ? (
            messages.map((message) => {
              const isIncoming = message.sendar === friendId;
              return (
                <li
                  key={message._id}
                  className={`max-w-[75%] md:max-w-[60%] p-3 rounded-2xl shadow-sm relative ${
                    isIncoming
                      ? "self-start bg-white text-gray-800 rounded-tl-none"
                      : "self-end bg-blue-600 text-white rounded-tr-none"
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed">
                    {isIncoming
                      ? message.translated_message
                      : message.original_message}
                  </p>
                  <span
                    className={`text-[10px] block text-right mt-1 ${isIncoming ? "text-gray-400" : "text-blue-200"}`}
                  >
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
              <p>No messages yet</p>
              <p className="text-sm">Say hello!</p>
            </div>
          )}
        </ul>
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-200 flex items-center gap-3">
        <input
          type="text"
          placeholder="type message"
          className="flex-1 py-3 px-5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700 placeholder-gray-400"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center"
          onClick={sendMessagesHandler}
        >
          <svg
            className="w-5 h-5 translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chat;
