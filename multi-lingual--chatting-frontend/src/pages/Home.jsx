import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(31,79,70,0.14),transparent_58%)]" />
      <div className="absolute left-0 top-16 -z-10 h-56 w-56 rounded-full bg-[#d7b06f]/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-72 w-72 rounded-full bg-[#1f4f46]/10 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-8">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d7b06f]/40 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6b38] shadow-sm">
            Real-time multilingual chat
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Speak in your language.
              <span className="block text-[#1f4f46]">Everyone understands.</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Send text or voice once. Contacts receive it translated as text
              or audio in the language they picked.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to={isLoggedIn ? "/Chat" : "/register"}
              className="rounded-full bg-[#1f4f46] px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-[#1f4f46]/20 transition-all hover:-translate-y-0.5 hover:bg-[#173d37]"
            >
              {isLoggedIn ? "Open Chat Workspace" : "Create Your Account"}
            </Link>
            <Link
              to={isLoggedIn ? "/addfriends" : "/login"}
              className="rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#1f4f46]/20 hover:text-[#1f4f46]"
            >
              {isLoggedIn ? "Find New Friends" : "Log In"}
            </Link>
          </div>

          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            {[
              {
                title: "Original stays yours",
                copy: "Your view keeps what you typed or spoke.",
              },
              {
                title: "Auto-translate",
                copy: "Friends see translated text or hear audio playback.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-200/40 backdrop-blur"
              >
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8a6b38]">
                  {item.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-[#fffdf9]/90 p-5 shadow-2xl shadow-slate-300/35 backdrop-blur sm:p-6">
          <div className="rounded-[1.7rem] bg-[#f4ede1] p-4 shadow-inner sm:p-5">
            <div className="flex items-center justify-between rounded-[1.5rem] bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6b38]">
                  Example
                </p>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  English to Hindi (audio)
                </h2>
              </div>
              <div className="rounded-full bg-[#1f4f46]/10 px-3 py-1 text-xs font-semibold text-[#1f4f46]">
                Live
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="ml-auto max-w-xs rounded-[1.6rem] rounded-tr-md bg-[#1f4f46] px-5 py-4 text-white shadow-lg shadow-[#1f4f46]/20">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7e7df]">
                  Sender
                </p>
                <p className="mt-2 text-lg font-semibold">Hi</p>
              </div>

              <div className="max-w-xs rounded-[1.6rem] rounded-tl-md border border-white/70 bg-white px-5 py-4 text-slate-800 shadow-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6b38]">
                  Receiver
                </p>
                <p className="mt-2 text-lg font-semibold">Namaste</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#f6efe2] px-3 py-1 text-xs font-semibold text-[#8a6b38]">
                  <span className="h-2 w-2 rounded-full bg-[#c98a32]" />
                  Auto audio
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
