import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import { LANGUAGE_OPTIONS } from "../services/languageSupport";

const MODE_OPTIONS = ["Text", "Audio", "None"];

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lang, setLang] = useState("en");
  const [mode, setMode] = useState("Text");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      await registerUser(name, username, password, lang, mode);
      setName("");
      setUsername("");
      setPassword("");
      setLang("en");
      setMode("Text");
      navigate("/Chat");
    } catch (error) {
      console.error("Registration failed:", error);
      setErrorMessage(error.message || "Unable to create the account.");
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f5f3ff] to-[#ffe4f0] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute left-0 top-10 -z-10 h-64 w-64 rounded-full bg-[#818cf8]/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-80 w-80 rounded-full bg-[#f472b6]/20 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-8">
        <section className="hidden rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-indigo-200/35 backdrop-blur lg:block">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#6d28d9]">
            Create your workspace
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[#0b0b12]">
            Set your language once. We handle the rest.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#475569]">
            Keep your original view while friends receive translations in their
            preferred format.
          </p>

          <div className="mt-8 space-y-4">
            {[
              {
                title: "Original stays yours",
                copy: "Your view keeps the exact words you sent.",
              },
              {
                title: "Translated for them",
                copy: "Contacts receive the translated message automatically.",
              },
              {
                title: "Audio optional",
                copy: "Play translated audio when they prefer listening.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-[#eef2ff] px-5 py-4 shadow-sm"
              >
                <p className="text-sm font-bold text-[#0b0b12]">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-[#475569]">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-indigo-200/30 backdrop-blur sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#be185d]">
              Sign Up
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-[#0b0b12]">
              Create your account
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#475569]">
              Choose your language and delivery mode.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#475569]">
                Name
              </label>
              <input
                type="text"
                placeholder="Krishan"
                className="w-full rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3.5 text-[#0b0b12] outline-none transition-all focus:border-[#6366f1]/40 focus:ring-4 focus:ring-[#c7d2fe]"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#475569]">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3.5 text-[#0b0b12] outline-none transition-all focus:border-[#6366f1]/40 focus:ring-4 focus:ring-[#c7d2fe]"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#475569]">
                Password
              </label>
              <input
                type="password"
                placeholder="Choose a secure password"
                className="w-full rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3.5 text-[#0b0b12] outline-none transition-all focus:border-[#6366f1]/40 focus:ring-4 focus:ring-[#c7d2fe]"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#475569]">
                  Preferred Language
                </label>
                <select
                  value={lang}
                  onChange={(event) => setLang(event.target.value)}
                  className="w-full rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3.5 text-[#0b0b12] outline-none transition-all focus:border-[#6366f1]/40 focus:ring-4 focus:ring-[#c7d2fe]"
                >
                  {LANGUAGE_OPTIONS.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#475569]">
                  Incoming Delivery
                </label>
                <select
                  value={mode}
                  name="mode"
                  onChange={(event) => setMode(event.target.value)}
                  className="w-full rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3.5 text-[#0b0b12] outline-none transition-all focus:border-[#6366f1]/40 focus:ring-4 focus:ring-[#c7d2fe]"
                >
                  {MODE_OPTIONS.map((modeOption) => (
                    <option key={modeOption} value={modeOption}>
                      {modeOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-[#2563eb] via-[#6d28d9] to-[#be185d] px-4 py-3.5 text-sm font-semibold text-white shadow-xl shadow-[#6d28d9]/25 transition-all hover:-translate-y-0.5"
            >
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#475569]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#5b21b6] transition-colors hover:text-[#4338ca]"
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
