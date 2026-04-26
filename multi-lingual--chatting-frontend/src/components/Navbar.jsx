import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";

const navigationClassName = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition-all ${
    isActive
      ? "bg-[#1f4f46] text-white shadow-lg shadow-[#1f4f46]/20"
      : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
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
    <nav className="sticky top-0 z-50 border-b border-white/60 bg-[#fcfaf5]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f4f46] text-lg font-extrabold text-white shadow-lg shadow-[#1f4f46]/25">
            M
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a6b38]">
              Live Translation
            </p>
            <p className="text-lg font-extrabold text-slate-900">
              Multilingual Chat
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/70 p-1 shadow-sm md:flex">
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
            </>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-[#1f4f46]/20 hover:text-[#1f4f46] hover:shadow-md"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[#c98a32] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#c98a32]/30 transition-all hover:-translate-y-0.5 hover:bg-[#b97b24]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          className="inline-flex items-center justify-center rounded-2xl border border-white/60 bg-white/80 p-3 text-slate-700 shadow-sm md:hidden"
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
        <div className="border-t border-white/70 bg-[#fcfaf5]/95 px-4 pb-5 pt-3 shadow-xl md:hidden">
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
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-left text-sm font-semibold text-slate-700"
              >
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full bg-[#c98a32] px-4 py-2.5 text-center text-sm font-semibold text-white"
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
