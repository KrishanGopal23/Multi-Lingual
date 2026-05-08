import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#d1d7db] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-md bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-center bg-[#f0f2f5] p-8 sm:p-12 lg:p-14">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#d9fdd3] px-4 py-2 text-xs font-semibold text-[#008069]">
            Real-time multilingual chat
          </div>

          <h1 className="mt-8 max-w-3xl text-4xl font-light leading-tight text-[#111b21] sm:text-5xl">
            Speak in your language.
            <span className="block font-semibold text-[#008069]">
              Everyone understands.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#54656f] sm:text-lg">
            Send text or voice once. Contacts receive translated messages in the
            language and format they prefer.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={isLoggedIn ? "/Chat" : "/register"}
              className="rounded-full bg-[#00a884] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#008069]"
            >
              {isLoggedIn ? "Open Chats" : "Create Account"}
            </Link>
            <Link
              to={isLoggedIn ? "/addfriends" : "/login"}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#008069] ring-1 ring-[#d1d7db] transition hover:bg-[#f0f2f5]"
            >
              {isLoggedIn ? "Find Friends" : "Log In"}
            </Link>
          </div>
        </section>

        <section className="wa-chat-wallpaper p-5 sm:p-8">
          <div className="mx-auto max-w-xl overflow-hidden rounded-md bg-white shadow-2xl">
            <div className="flex items-center gap-3 bg-[#f0f2f5] px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-sm font-bold text-white">
                H
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-[#111b21]">
                  Hindi Practice
                </h2>
                <p className="text-xs text-[#667781]">online</p>
              </div>
            </div>

            <div className="wa-chat-wallpaper space-y-3 px-4 py-8">
              <div className="max-w-xs rounded-lg rounded-tl-none bg-white px-3 py-2 text-[#111b21] shadow-sm">
                <p className="text-sm">Namaste</p>
                <p className="mt-1 text-right text-[11px] text-[#8696a0]">
                  10:24 AM
                </p>
              </div>

              <div className="ml-auto max-w-xs rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-[#111b21] shadow-sm">
                <p className="text-sm">Hi</p>
                <p className="mt-1 text-right text-[11px] text-[#667781]">
                  10:25 AM
                </p>
              </div>

              <div className="max-w-sm rounded-lg rounded-tl-none bg-white px-3 py-2 text-[#111b21] shadow-sm">
                <p className="text-sm">
                  I received your translated text and audio.
                </p>
                <p className="mt-1 text-right text-[11px] text-[#8696a0]">
                  10:26 AM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#f0f2f5] px-4 py-3">
              <div className="flex-1 rounded-full bg-white px-4 py-2 text-sm text-[#667781]">
                Message
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-white">
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
