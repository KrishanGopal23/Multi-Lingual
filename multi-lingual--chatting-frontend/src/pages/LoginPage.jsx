import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../services/api";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(username, password);
      console.log(response);
      setUsername("");
      setPassword("");
      navigate("/Chat");
      localStorage.setItem("token", response.token);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="bg-linear-to-br from-blue-100 to-indigo-200 flex justify-center items-center h-[90vh] p-4">
      <div className="flex justify-center items-center flex-col w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <h1 className="font-extrabold text-3xl text-gray-800">Login</h1>
        <form action="/hello" className="flex flex-col w-full space-y-4">
          <input
            type="text"
            placeholder="username"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
            onClick={handleSubmit}
          >
            Login
          </button>
        </form>
        <div className="text-center text-sm text-gray-600">
          <span>Don't have an account? </span>
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
