import React, { useState, useEffect } from "react";
import { getUsers, addFriend } from "../services/api";

const AddFriends = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getUsers();
        setUsers(response.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleAddFriend = async (userId) => {
    try {
      await addFriend(userId);
      alert("Friend request sent!");
      
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl tracking-tight">
            Find Friends
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Connect with people and start chatting in your preferred language.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1"
              >
                <div className="h-32 bg-linear-to-r from-blue-500 to-indigo-600"></div>
                <div className="relative px-6 pb-6">
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                    <div className="h-24 w-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center shadow-md">
                      <span className="text-2xl font-bold text-gray-500 uppercase">
                        {user.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-12 text-center">
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                      
                    </h3>
                    <p className="text-xl mt-12 font-bold text-gray-900 truncate">
                      {user.name || "username"}
                    </p>
                    <button
                      onClick={() => handleAddFriend(user._id)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-md"
                    >
                      <svg
                        className="mr-2 -ml-1 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      Add Friend
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No users found.</div>
        )}
      </div>
    </div>
  );
};

export default AddFriends;
