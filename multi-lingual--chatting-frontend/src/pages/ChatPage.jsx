import React, { useEffect, useState } from "react";
import Contacts from "../components/Contacts.jsx";
import Chat from "../components/Chat.jsx";
import { getFriends, getMessages, getProfile } from "../services/api";
import { getLanguageLabel, getModeLabel } from "../services/languageSupport";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const ChatPage = () => {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [friendId, setFriendId] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(getStoredUser);

  useEffect(() => {
    const loadChatData = async () => {
      const [friendsResult, profileResult] = await Promise.allSettled([
        getFriends(),
        getProfile(),
      ]);

      if (friendsResult.status === "fulfilled") {
        setFriends(friendsResult.value.user_friends || []);
      } else {
        console.error("Error fetching friends:", friendsResult.reason);
      }

      if (profileResult.status === "fulfilled") {
        setCurrentUserProfile(profileResult.value.user || {});
      } else {
        console.error("Error fetching profile:", profileResult.reason);
      }
    };

    loadChatData();
  }, []);

  const refreshMessages = async (currentFriendId) => {
    if (!currentFriendId) {
      return [];
    }

    try {
      const response = await getMessages(currentFriendId);
      const nextMessages = response.message || response.messages || [];
      setMessages(nextMessages);
      return nextMessages;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  useEffect(() => {
    let interval;
    if (friendId) {
      interval = setInterval(() => refreshMessages(friendId), 2000);
    }
    return () => clearInterval(interval);
  }, [friendId]);

  const handleFriendSelect = async (id) => {
    try {
      const nextMessages = await getMessages(id);
      setMessages(nextMessages.message || nextMessages.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    }

    setFriendId(id);
  };

  const selectedFriend =
    friends.find((friend) => friend._id === friendId) || null;

  return (
    <div className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute left-0 top-12 -z-10 h-72 w-72 rounded-full bg-[#d7b06f]/18 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-80 w-80 rounded-full bg-[#1f4f46]/12 blur-3xl" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-5 rounded-[2rem] border border-white/70 bg-white/75 px-5 py-4 shadow-xl shadow-slate-200/30 backdrop-blur sm:px-6 sm:py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#8a6b38]">
                Chat Workspace
              </p>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Send once. Translate automatically.
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
                Originals stay yours. Friends receive translations their way.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-[#eef4f2] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1f4f46]">
                  Your Language
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {getLanguageLabel(currentUserProfile.preferred_language)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#fff4df] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6b38]">
                  Incoming Mode
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {getModeLabel(currentUserProfile.preferred_mode)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:h-[calc(100vh-13rem)]">
          <div className={`${friendId ? "hidden lg:block" : "block"} h-full`}>
            <Contacts
              friends={friends}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              fetchMessages={handleFriendSelect}
              currentFriendId={friendId}
            />
          </div>

          <div className={`${friendId ? "block" : "hidden lg:block"} h-full`}>
            {friendId ? (
              <Chat
                key={friendId}
                messages={messages}
                friendId={friendId}
                friend={selectedFriend}
                currentUserProfile={currentUserProfile}
                onBack={() => setFriendId(null)}
                refreshMessages={() => refreshMessages(friendId)}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-2xl shadow-slate-300/20 backdrop-blur">
                <div className="max-w-md">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-[#f6efe2] text-[#1f4f46] shadow-inner">
                    <svg
                      className="h-10 w-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z"
                      />
                    </svg>
                  </div>
                  <h2 className="mt-6 text-2xl font-extrabold text-slate-900">
                    Pick a contact to begin
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    You keep originals. They get translations.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
