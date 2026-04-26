import React from "react";
import { getLanguageLabel, getModeLabel } from "../services/languageSupport";

const Contacts = ({
  friends,
  searchQuery,
  setSearchQuery,
  fetchMessages,
  currentFriendId,
}) => {
  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full w-full flex-col rounded-[2rem] border border-white/70 bg-[#fffdf9]/85 p-4 shadow-2xl shadow-slate-300/20 backdrop-blur">
      <div className="shrink-0 rounded-[1.6rem] bg-[#f6efe2] p-5 shadow-inner">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6b38]">
              Contacts
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Your people
            </h1>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              {friends.length}
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <input
            type="text"
            placeholder="Search contacts"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-2xl border border-white/70 bg-white px-12 py-3.5 text-sm text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#1f4f46]/20 focus:ring-4 focus:ring-[#1f4f46]/10"
          />
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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

      <ul className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => {
            const isActive = currentFriendId === friend._id;

            return (
              <li key={friend._id}>
                <button
                  type="button"
                  onClick={() => fetchMessages(friend._id)}
                  className={`w-full rounded-[1.6rem] border px-4 py-4 text-left transition-all duration-200 ${
                    isActive
                      ? "border-[#1f4f46]/20 bg-[#eef4f2] shadow-lg shadow-[#1f4f46]/10"
                      : "border-white/70 bg-white/80 shadow-sm hover:-translate-y-0.5 hover:border-[#d7b06f]/30 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] text-lg font-extrabold ${
                        isActive
                          ? "bg-[#1f4f46] text-white"
                          : "bg-[#f6efe2] text-[#1f4f46]"
                      }`}
                    >
                      {friend.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="truncate text-base font-bold text-slate-900">
                          {friend.name}
                        </h3>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6b38] shadow-sm">
                          {getModeLabel(friend.preferred_mode)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Receives messages in{" "}
                        <span className="font-semibold text-slate-700">
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
          <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-white/70 px-5 py-10 text-center">
            <p className="text-base font-bold text-slate-700">
              No contacts found
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Try a different name or add more friends.
            </p>
          </div>
        )}
      </ul>
    </div>
  );
};

export default Contacts;
