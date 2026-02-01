import React from "react";

const Contacts = ({ friends, searchQuery, setSearchQuery, fetchMessages }) => {
  // const [friends, setFriends] = useState([]);
  // const [searchQuery, setSearchQuery] = useState("");

  // useEffect(() => {
  //   const fetchFriends = async () => {
  //     try {
  //       const response = await getFriends();
  //       setFriends(response.user_friends || []);
  //     } catch (error) {
  //       console.error("Error fetching friends:", error);
  //     }
  //   };

  //   fetchFriends();
  // }, []);

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="p-5 shrink-0 border-b border-gray-100 bg-white z-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 tracking-tight flex items-center gap-2">
          Contacts
        </h1>
        <div className="relative group">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all focus:bg-white"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors group-hover:text-blue-500"
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

      <ul className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => (
            <li
              key={friend._id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
              onClick={() => fetchMessages(friend._id)}
            >
              <div className="w-12 h-12 shrink-0 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                {friend.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">
                  {friend.name}
                </h3>
                <p className="text-xs text-gray-500 truncate">Tap to chat</p>
              </div>
            </li>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p>No contacts found</p>
          </div>
        )}
      </ul>
    </div>
  );
};

export default Contacts;
