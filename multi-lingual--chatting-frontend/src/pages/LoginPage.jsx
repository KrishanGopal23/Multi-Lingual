import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      await loginUser(email, password);
      setEmail("");
      setPassword("");
      navigate("/Chat");
    } catch (error) {
      console.error("Login failed:", error);
      setErrorMessage(error.message || "Unable to log in with those details.");
    }
  };

  return (
    <div className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute left-0 top-10 -z-10 h-64 w-64 rounded-full bg-[#d7b06f]/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-80 w-80 rounded-full bg-[#1f4f46]/10 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-8">
        <section className="hidden rounded-[2rem] border border-white/70 bg-[#fffdf9]/90 p-8 shadow-2xl shadow-slate-300/35 backdrop-blur lg:block">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#8a6b38]">
            Welcome back
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900">
            Continue conversations without language friction.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Keep your original view while friends receive translated text or
            audio.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              "Speak or type freely",
              "Automatic audio playback",
              "Clean sender vs receiver views",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl bg-[#f6efe2] px-4 py-4 text-sm font-semibold text-slate-700"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f4f46] text-white">
                  OK
                </span>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-300/30 backdrop-blur sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#8a6b38]">
              Log In
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
              Log in to your workspace
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Send originals, deliver translations.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-[#fcfaf5] px-4 py-3.5 text-slate-800 outline-none transition-all focus:border-[#1f4f46]/30 focus:ring-4 focus:ring-[#1f4f46]/10"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-slate-200 bg-[#fcfaf5] px-4 py-3.5 text-slate-800 outline-none transition-all focus:border-[#1f4f46]/30 focus:ring-4 focus:ring-[#1f4f46]/10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#1f4f46] px-4 py-3.5 text-sm font-semibold text-white shadow-xl shadow-[#1f4f46]/20 transition-all hover:-translate-y-0.5 hover:bg-[#173d37]"
            >
              Log In
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#1f4f46] transition-colors hover:text-[#173d37]"
            >
              Create one
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
