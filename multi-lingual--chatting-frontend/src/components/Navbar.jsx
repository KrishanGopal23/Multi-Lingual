import React from "react";
import {Link} from "react-router-dom";

const Navbar = () => {
  return (
    <div className="bg-blue-500 h-16 w-full text-white flex items-center justify-between px-4 md:px-8 shrink-0">
      <h1>
        <Link to="/chat" className="hover:underline">
          Chat
        </Link>
      </h1>
      <h1 className="text-xl font-bold">
        <Link to="/" className="hover:underline">
          Multi-Lingual Chatting App
        </Link>
      </h1>
      <div className="space-x-4 flex ">
        <Link to="/login" className="hover:underline">
          Login
        </Link>
        <Link to="/register" className="hover:underline">
          Register
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
