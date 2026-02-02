import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";

const Navbar = () => {
  const navigate = useNavigate();
  // const location = useLocation(); // Triggers re-render on route change
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                M
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">
                <span className="hidden sm:inline">Multi-Lingual Chat</span>
                <span className="sm:hidden">ML Chat</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link
              to="/"
              className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Home
            </Link>
            {isLoggedIn && (
              <>
                <Link
                  to="/chat"
                  className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Chat
                </Link>
                <Link
                  to="/addfriends"
                  className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Find Friends
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            {isLoggedIn && (
              <>
                <Link
                  to="/chat"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Chat
                </Link>
                <Link
                  to="/addfriends"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Find Friends
                </Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-4 border-t border-gray-200">
            <div className="flex items-center px-5">
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              ) : (
                <div className="space-y-2 w-full">
                  <Link
                    to="/login"
                    className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full text-center px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
