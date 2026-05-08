import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#eef2ff] via-[#f5f3ff] to-[#ffe4f0] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-center bg-[#f7f8ff] p-8 sm:p-12 lg:p-14">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#ffe4f0] px-4 py-2 text-xs font-semibold text-[#be185d]">
            Real-time multilingual chat
          </div>

          <h1 className="mt-8 max-w-3xl text-4xl font-light leading-tight text-[#0b0b12] sm:text-5xl">
            Speak in your language.
            <span className="block font-semibold text-[#5b21b6]">
              Everyone understands.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#475569] sm:text-lg">
            Send text or voice once. Contacts receive translated messages in the
            language and format they prefer.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={isLoggedIn ? "/Chat" : "/register"}
              className="rounded-full bg-gradient-to-r from-[#2563eb] via-[#6d28d9] to-[#be185d] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(59,91,219,0.35)] transition hover:-translate-y-0.5"
            >
              {isLoggedIn ? "Open Chats" : "Create Account"}
            </Link>
            <Link
              to={isLoggedIn ? "/addfriends" : "/login"}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#3b5bdb] ring-1 ring-[#c7d2fe] transition hover:bg-[#eef2ff]"
            >
              {isLoggedIn ? "Find Friends" : "Log In"}
            </Link>
          </div>
        </section>

        <section className="wa-chat-wallpaper p-5 sm:p-8">
          <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center gap-3 bg-[#eef2ff] px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6d28d9] text-sm font-bold text-white">
                H
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-[#0b0b12]">
                  Hindi Practice
                </h2>
                <p className="text-xs text-[#64748b]">online</p>
              </div>
            </div>

            <div className="wa-chat-wallpaper space-y-3 px-4 py-8">
              <div className="max-w-xs rounded-lg rounded-tl-none bg-white px-3 py-2 text-[#0b0b12] shadow-sm">
                <p className="text-sm">Namaste</p>
                <p className="mt-1 text-right text-[11px] text-[#94a3b8]">
                  10:24 AM
                </p>
              </div>

              <div className="ml-auto max-w-xs rounded-lg rounded-tr-none bg-[#fce7f3] px-3 py-2 text-[#0b0b12] shadow-sm">
                <p className="text-sm">Hi</p>
                <p className="mt-1 text-right text-[11px] text-[#64748b]">
                  10:25 AM
                </p>
              </div>

              <div className="max-w-sm rounded-lg rounded-tl-none bg-white px-3 py-2 text-[#0b0b12] shadow-sm">
                <p className="text-sm">
                  I received your translated text and audio.
                </p>
                <p className="mt-1 text-right text-[11px] text-[#94a3b8]">
                  10:26 AM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#eef2ff] px-4 py-3">
              <div className="flex-1 rounded-full bg-white px-4 py-2 text-sm text-[#64748b]">
                Message
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb] text-white">
                <svg className="h-5 w-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
