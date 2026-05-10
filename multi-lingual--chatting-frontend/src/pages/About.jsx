import React from "react";

const highlights = [
  {
    title: "Live translation",
    description:
      "Send in your language, receive in theirs. Each user chooses a preferred language and delivery mode.",
  },
  {
    title: "Text and audio",
    description:
      "Switch between text and audio delivery without losing the chat flow.",
  },
  {
    title: "Multilingual toggle",
    description:
      "Turn off translation for faster original-language messaging when both users prefer it.",
  },
  {
    title: "Conversation tools",
    description:
      "Reply, edit, forward, react, and manage media with a clean, familiar layout.",
  },
];

const About = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#eef2ff] via-[#f5f3ff] to-[#ffe4f0] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-2xl bg-white px-8 py-10 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6d28d9]">
            About Us
          </p>
          <h1 className="mt-3 text-4xl font-light text-[#0b0b12]">
            Molta multilingual chat that feels natural
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#475569]">
            This project helps people communicate across languages with clear
            translation, flexible delivery modes, and fast messaging when
            translation is not needed.
          </p>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="text-lg font-semibold text-[#0b0b12]">
              Why we built this
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#475569]">
              People often chat in mixed-language groups or with friends who
              prefer a different language. We wanted a workspace that removes
              the friction: translate automatically, speak messages aloud, or
              turn translation off when both users want the original message.
            </p>
            <div className="mt-6 grid gap-4">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-[#e2e8f0] bg-[#f5f3ff] px-5 py-4"
                >
                  <h3 className="text-sm font-semibold text-[#0b0b12]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#475569]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl bg-gradient-to-br from-[#1e3a8a] via-[#6d28d9] to-[#be185d] p-8 text-white shadow-xl">
            <h2 className="text-lg font-semibold">At a glance</h2>
            <ul className="mt-5 space-y-3 text-sm text-white/90">
              <li>Personalized language and delivery settings</li>
              <li>Speech-to-text and text-to-speech tools</li>
              <li>Presence, typing, and read receipts</li>
              <li>Media sharing with quick previews</li>
              <li>Multilingual on/off for faster chats</li>
            </ul>
            <div className="mt-6 rounded-xl bg-white/15 px-5 py-4 text-sm">
              <p className="font-semibold">New here?</p>
              <p className="mt-2 text-white/80">
                Create an account, pick your preferred language, and start
                chatting with instant translation.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default About;
