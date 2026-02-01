import React from "react";
import Contacts from "../components/Contacts.jsx";
import Chat from "../components/Chat.jsx";
import { useState, useEffect } from "react";
import { getFriends, getMessages } from "../services/api";

const ChatPage = () => {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [friendId, setFriendId] = useState(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await getFriends();
        setFriends(response.user_friends || []);
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    };

    fetchFriends();
  }, []);

  // Helper to fetch messages without setting friendId (used for polling/refresh)
  const refreshMessages = async (currentFriendId) => {
    try {
      const response = await getMessages(currentFriendId);
      // Handle 'message', 'messages', or if response itself is the array
      setMessages(response.message || response.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Polling for new messages every 2 seconds
  useEffect(() => {
    let interval;
    if (friendId) {
      interval = setInterval(() => refreshMessages(friendId), 2000);
    }
    return () => clearInterval(interval);
  }, [friendId]);

  // Handler for selecting a friend
  const handleFriendSelect = async (id) => {
    setFriendId(id);
    await refreshMessages(id);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-gray-100 overflow-hidden">
      <div
        className={`w-full md:w-1/3 lg:w-1/4 h-full border-r border-gray-200 bg-white ${friendId ? "hidden md:flex" : "flex"}`}
      >
        <Contacts
          friends={friends}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          fetchMessages={handleFriendSelect}
        />
      </div>

      <div
        className={`flex-1 h-full ${friendId ? "flex" : "hidden md:flex"} bg-gray-50`}
      >
        {friendId ? (
          <Chat
            messages={messages}
            friendId={friendId}
            onBack={() => setFriendId(null)}
            refreshMessages={() => refreshMessages(friendId)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium">
              Select a contact to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
