import React from "react";
import { Link } from "react-router-dom";
import { logoutUser } from "../services/api";

const Navbar = () => {
  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="bg-linear-to-r from-blue-600 to-indigo-700 h-16 w-full text-white flex items-center justify-between px-4 md:px-8 shrink-0 shadow-md z-50 relative">
      <h1>
        <Link
          to="/chat"
          className="hover:text-blue-200 transition-colors font-medium"
        >
          Chat
        </Link>
      </h1>
      <h1 className="text-xl font-bold">
        <Link to="/" className="hover:text-blue-200 transition-colors">
          <span className="hidden md:block">Multi-Lingual Chatting App</span>
          <span className="md:hidden">ML Chat</span>
        </Link>
      </h1>
      <div className="flex items-center gap-4">
        <Link to="/login" className="hover:text-blue-200 transition-colors">
          <button className="font-medium">Login</button>
        </Link>
        <Link
          to="/register"
          className="bg-white text-blue-600 px-4 py-1.5 rounded-full font-medium hover:bg-blue-50 transition-colors shadow-sm"
        >
          Register
        </Link>

        <button
          onClick={handleLogout}
          className="hover:text-red-200 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
