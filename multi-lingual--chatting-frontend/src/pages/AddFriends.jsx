import React, { useEffect, useState } from "react";
import { addFriend, getUsers } from "../services/api";
import { getLanguageLabel, getModeLabel } from "../services/languageSupport";

const AddFriends = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [addingUserId, setAddingUserId] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getUsers();
        setUsers(response.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setStatusMessage("Unable to load people right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleAddFriend = async (userId, userName) => {
    try {
      setAddingUserId(userId);
      setStatusMessage("");
      await addFriend(userId);
      setUsers((currentUsers) =>
        currentUsers.filter((user) => user._id !== userId),
      );
      setStatusMessage(`${userName} was added to your contacts.`);
    } catch (error) {
      console.error("Error adding friend:", error);
      setStatusMessage(error.message || "Unable to add that friend right now.");
    } finally {
      setAddingUserId("");
    }
  };

  return (
    <div className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute right-0 top-16 -z-10 h-72 w-72 rounded-full bg-[#1f4f46]/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-[#d7b06f]/18 blur-3xl" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#8a6b38]">
              Find Friends
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Build a contact list that already understands your flow.
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Discover new people, see their preferred language and delivery
              mode, and start chatting with translated text or audio right away.
            </p>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/80 px-5 py-4 shadow-lg shadow-slate-200/35 backdrop-blur">
            <p className="text-sm font-semibold text-slate-500">
              Available profiles
            </p>
            <p className="text-3xl font-extrabold text-slate-900">
              {users.length}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className="mb-6 rounded-3xl border border-[#d7b06f]/25 bg-[#fff7ea] px-5 py-4 text-sm font-medium text-[#8a6b38] shadow-sm">
            {statusMessage}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[22rem] items-center justify-center rounded-[2rem] border border-white/70 bg-white/70 shadow-xl shadow-slate-200/30 backdrop-blur">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1f4f46] border-t-transparent" />
              Loading profiles...
            </div>
          </div>
        ) : users.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {users.map((user) => (
              <article
                key={user._id}
                className="group overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-xl shadow-slate-200/35 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl backdrop-blur"
              >
                <div className="relative h-36 bg-[linear-gradient(135deg,#1f4f46_0%,#2f7a6a_58%,#d7b06f_100%)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_45%)]" />
                </div>

                <div className="relative px-6 pb-6">
                  <div className="absolute -top-14 left-6 flex h-24 w-24 items-center justify-center rounded-[1.8rem] border-4 border-[#fffdf9] bg-[#fcfaf5] text-3xl font-extrabold text-[#1f4f46] shadow-xl">
                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  <div className="pt-16">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900">
                          {user.name || "Unknown"}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          Ready for multilingual chat delivery
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#eef4f2] px-3 py-1 text-xs font-semibold text-[#1f4f46]">
                        {getLanguageLabel(user.preferred_language)}
                      </span>
                      <span className="rounded-full bg-[#fff4df] px-3 py-1 text-xs font-semibold text-[#8a6b38]">
                        {getModeLabel(user.preferred_mode)}
                      </span>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-600">
                      Add this contact to start sending your original messages
                      while they receive translated delivery in their own style.
                    </p>

                    <button
                      onClick={() => handleAddFriend(user._id, user.name)}
                      disabled={addingUserId === user._id}
                      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all ${
                        addingUserId === user._id
                          ? "cursor-not-allowed bg-slate-400"
                          : "bg-[#1f4f46] shadow-[#1f4f46]/20 hover:-translate-y-0.5 hover:bg-[#173d37]"
                      }`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      {addingUserId === user._id ? "Adding..." : "Add Friend"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/70 bg-white/80 px-8 py-16 text-center shadow-xl shadow-slate-200/30 backdrop-blur">
            <p className="text-xl font-bold text-slate-900">No users found.</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Everyone available may already be in your friends list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFriends;
