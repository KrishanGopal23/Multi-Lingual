import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Contacts from "../components/Contacts.jsx";
import Chat from "../components/Chat.jsx";
import {
  getFriends,
  getMessages,
  getProfile,
  heartbeatPresence,
  searchGlobalMessages,
} from "../services/api";

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
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const navigate = useNavigate();

  const isGlobalSearchActive = globalSearchQuery.trim().length > 0;
  const visibleGlobalSearchResults = isGlobalSearchActive
    ? globalSearchResults
    : [];
  const isShowingGlobalSearchLoader =
    isGlobalSearchActive && isSearchingGlobal;

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

  useEffect(() => {
    let interval;

    const sendHeartbeat = async () => {
      try {
        await heartbeatPresence();
      } catch (error) {
        console.error("Presence heartbeat failed:", error);
      }
    };

    sendHeartbeat();
    interval = setInterval(sendHeartbeat, 20000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isGlobalSearchActive) {
      return;
    }

    let isCancelled = false;

    const handle = setTimeout(() => {
      setIsSearchingGlobal(true);
      searchGlobalMessages(globalSearchQuery.trim(), "all")
        .then((response) => {
          if (!isCancelled) {
            setGlobalSearchResults(response.results || []);
          }
        })
        .catch((error) => {
          if (!isCancelled) {
            console.error("Global search failed:", error);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsSearchingGlobal(false);
          }
        });
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(handle);
    };
  }, [globalSearchQuery, isGlobalSearchActive]);

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

  const globalToolbar = (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
        <input
          type="text"
          placeholder="Search"
          value={globalSearchQuery}
          onChange={(event) => setGlobalSearchQuery(event.target.value)}
          className="h-9 w-full rounded-full border-0 bg-[#eef2ff] px-9 text-sm text-[#0b0b12] outline-none placeholder:text-[#64748b] focus:ring-2 focus:ring-[#c7d2fe]"
        />
        <svg
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
        <button
          type="button"
          onClick={() => navigate("/addfriends")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#475569] transition hover:bg-[#e0e7ff]"
          title="New chat"
        >
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {isGlobalSearchActive && (
        <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white">
              {visibleGlobalSearchResults.length > 0 ? (
                visibleGlobalSearchResults.map((result) => {
                  const message = result.message;
                  const friend = result.friend;
                  const previewText =
                    message?.original_message ||
                    message?.translated_message ||
                    "Media";

                  return (
                    <button
                      key={message?._id}
                      type="button"
                      onClick={() => {
                        if (friend?.id) {
                          handleFriendSelect(friend.id);
                        }
                      }}
                      className="block w-full border-b border-[#e2e8f0] px-3 py-2 text-left last:border-b-0 hover:bg-[#eef2ff]"
                    >
                      <p className="truncate text-sm font-semibold text-[#0b0b12]">
                        {friend?.name || "Unknown"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#64748b]">
                        {isShowingGlobalSearchLoader
                          ? "Searching..."
                          : previewText}
                      </p>
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-3 text-sm text-[#64748b]">
                  {isShowingGlobalSearchLoader
                    ? "Searching..."
                    : "No messages found."}
                </p>
              )}
            </div>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] bg-[#eef2ff] p-0 md:p-4">
      <div className="mx-auto grid h-full max-w-[1600px] overflow-hidden bg-white shadow-2xl md:rounded-2xl lg:grid-cols-[26rem_minmax(0,1fr)]">
          <div className={`${friendId ? "hidden lg:flex" : "flex"} min-h-0`}>
            <Contacts
              friends={friends}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              fetchMessages={handleFriendSelect}
              currentFriendId={friendId}
              toolbar={globalToolbar}
            />
          </div>

          <div className={`${friendId ? "block" : "hidden lg:block"} min-h-0`}>
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
              <div className="flex h-full items-center justify-center border-b-4 border-[#6d28d9] bg-[#eef2ff] p-8 text-center">
                <div className="max-w-lg">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fce7f3] text-[#be185d]">
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
                  <h2 className="mt-6 text-3xl font-light text-[#1f2937]">
                    Multilingual Chat
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#475569]">
                    Select a chat to send translated text, voice, media, and
                    quick replies in a WhatsApp-style workspace.
                  </p>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default ChatPage;
