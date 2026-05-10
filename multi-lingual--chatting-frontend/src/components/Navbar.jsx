import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";

const navigationClassName = ({ isActive }) =>
  `rounded-full px-3.5 py-2 text-sm font-semibold transition-all ${
    isActive
      ? "bg-white/20 text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
      : "text-white/85 hover:bg-white/12 hover:text-white"
  }`;

const Navbar = () => {
  const navigate = useNavigate();
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
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-[#1e3a8a] via-[#6d28d9] to-[#be185d] text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 shadow-[0_10px_25px_rgba(30,64,175,0.35)] ring-1 ring-white/25 transition group-hover:-translate-y-0.5 group-hover:bg-white/20">
            <img
              src="/logo.png"
              alt="Molta Multilingual Chat logo"
              className="h-8 w-8 rounded-xl object-contain"
            />
          </div>
          <div>
            <p className="text-lg font-extrabold center text-white">
              Molta
            </p>
            <p className="text-base font-bold text-white">
              MultiLingual Chat
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 rounded-full bg-white/10 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur md:flex">
          <NavLink to="/" className={navigationClassName}>
            Home
          </NavLink>
          <NavLink to="/about" className={navigationClassName}>
            About
          </NavLink>
          {isLoggedIn && (
            <>
              <NavLink to="/Chat" className={navigationClassName}>
                Chat
              </NavLink>
              <NavLink to="/addfriends" className={navigationClassName}>
                Find Friends
              </NavLink>
              <NavLink to="/settings" className={navigationClassName}>
                Settings
              </NavLink>
            </>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#6d28d9] to-[#be185d] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(59,91,219,0.35)] ring-1 ring-white/20 transition-all hover:brightness-110"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#6d28d9] to-[#be185d] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(59,91,219,0.35)] ring-1 ring-white/20 transition-all hover:brightness-110"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#6d28d9] to-[#be185d] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(59,91,219,0.35)] ring-1 ring-white/20 transition-all hover:brightness-110"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          className="inline-flex items-center justify-center rounded-full bg-white/12 p-2.5 text-white md:hidden"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="sr-only">Open navigation</span>
          {!isMobileMenuOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

      {isMobileMenuOpen && (
        <div className="border-t border-white/15 bg-[#6d28d9] px-4 pb-5 pt-3 shadow-xl md:hidden">
          <div className="flex flex-col gap-2">
            <NavLink
              to="/"
              className={navigationClassName}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={navigationClassName}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </NavLink>
            {isLoggedIn && (
              <>
                <NavLink
                  to="/Chat"
                  className={navigationClassName}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Chat
                </NavLink>
                <NavLink
                  to="/addfriends"
                  className={navigationClassName}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Find Friends
                </NavLink>
                <NavLink
                  to="/settings"
                  className={navigationClassName}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </NavLink>
              </>
            )}
          </div>

          <div className="mt-4 border-t border-white/25 pt-4">
            {isLoggedIn ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#6d28d9] to-[#be185d] px-4 py-2.5 text-left text-sm font-semibold text-white ring-1 ring-white/20"
              >
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#6d28d9] to-[#be185d] px-4 py-2.5 text-center text-sm font-semibold text-white ring-1 ring-white/20"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#6d28d9] to-[#be185d] px-4 py-2.5 text-center text-sm font-semibold text-white ring-1 ring-white/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
