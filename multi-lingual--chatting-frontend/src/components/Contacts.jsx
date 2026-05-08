import React from "react";
import { getLanguageLabel, getModeLabel } from "../services/languageSupport";

const Contacts = ({
  friends,
  searchQuery,
  setSearchQuery,
  fetchMessages,
  currentFriendId,
  toolbar,
}) => {
  const filteredFriends = friends.filter((friend) =>
    (friend.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 bg-[#f0f2f5] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-sm font-extrabold text-white">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111b21]">Chats</h1>
              <p className="text-xs font-medium text-[#667781]">
                {friends.length} contacts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#54656f]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#e2e6e8]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.835L3 20l1.13-3.388A7.46 7.46 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-[#e9edef] bg-white px-3 py-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border-0 bg-[#f0f2f5] px-11 py-2.5 text-sm text-[#111b21] outline-none placeholder:text-[#667781] focus:ring-2 focus:ring-[#00a884]/25"
          />
          <svg
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667781]"
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
      </div>

      {toolbar && (
        <div className="shrink-0 border-b border-[#e9edef] bg-white">
          {toolbar}
        </div>
      )}

      <ul className="flex-1 overflow-y-auto">
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => {
            const isActive = currentFriendId === friend._id;

            return (
              <li key={friend._id}>
                <button
                  type="button"
                  onClick={() => fetchMessages(friend._id)}
                  className={`w-full border-b border-[#e9edef] px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-[#f0f2f5]"
                      : "bg-white hover:bg-[#f5f6f6]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${
                        isActive
                          ? "bg-[#00a884] text-white"
                          : "bg-[#dfe5e7] text-[#54656f]"
                      }`}
                    >
                      {(friend.name || "?").charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate text-[15px] font-semibold text-[#111b21]">
                          {friend.name}
                        </h3>
                        <span className="shrink-0 text-xs font-medium text-[#667781]">
                          {getModeLabel(friend.preferred_mode)}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-[#667781]">
                        Receives messages in{" "}
                        <span className="font-medium text-[#54656f]">
                          {getLanguageLabel(friend.preferred_language)}
                        </span>
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })
        ) : (
          <div className="px-5 py-14 text-center">
            <p className="text-base font-semibold text-[#111b21]">
              No contacts found
            </p>
            <p className="mt-2 text-sm text-[#667781]">
              Try a different name or add more friends.
            </p>
          </div>
        )}
      </ul>
    </div>
  );
};

export default Contacts;
