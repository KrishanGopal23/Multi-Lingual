import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";

const navigationClassName = ({ isActive }) =>
  `rounded-full px-3.5 py-2 text-sm font-semibold transition-all ${
    isActive
      ? "bg-white/18 text-white"
      : "text-white/82 hover:bg-white/12 hover:text-white"
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
    <nav className="sticky top-0 z-50 bg-[#008069] text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/16 text-base font-extrabold text-white ring-1 ring-white/20">
            M
          </div>
          <div>
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 sm:block">
              Live Translation
            </p>
            <p className="text-base font-extrabold text-white">
              Multilingual Chat
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 rounded-full bg-white/8 p-1 md:flex">
          <NavLink to="/" className={navigationClassName}>
            Home
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
              className="rounded-full bg-white/14 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/86 transition-all hover:bg-white/12 hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#008069] transition-all hover:bg-[#e9edef]"
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
        <div className="border-t border-white/10 bg-[#008069] px-4 pb-5 pt-3 shadow-xl md:hidden">
          <div className="flex flex-col gap-2">
            <NavLink
              to="/"
              className={navigationClassName}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
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

          <div className="mt-4 border-t border-slate-200/70 pt-4">
            {isLoggedIn ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full rounded-full bg-white/14 px-4 py-2.5 text-left text-sm font-semibold text-white"
              >
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full bg-white/14 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#008069]"
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
