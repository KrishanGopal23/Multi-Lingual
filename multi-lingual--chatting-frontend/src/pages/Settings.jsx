import React, { useEffect, useMemo, useState } from "react";
import { getProfile, updatePreferences } from "../services/api";
import { LANGUAGE_OPTIONS, getModeLabel } from "../services/languageSupport";

const modeOptions = [
  { value: "Text", label: getModeLabel("Text") },
  { value: "Audio", label: getModeLabel("Audio") },
  { value: "None", label: getModeLabel("None") },
];

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const Settings = () => {
  const storedUser = useMemo(readStoredUser, []);
  const [preferredLanguage, setPreferredLanguage] = useState(
    storedUser.preferred_language || "en",
  );
  const [preferredMode, setPreferredMode] = useState(
    storedUser.preferred_mode || "Text",
  );
  const [multilingualEnabled, setMultilingualEnabled] = useState(
    typeof storedUser.multilingual_enabled === "boolean"
      ? storedUser.multilingual_enabled
      : true,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((response) => {
        if (!isMounted) return;
        const profile = response.user || {};
        setPreferredLanguage(profile.preferred_language || "en");
        setPreferredMode(profile.preferred_mode || "Text");
        setMultilingualEnabled(
          typeof profile.multilingual_enabled === "boolean"
            ? profile.multilingual_enabled
            : true,
        );
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load settings.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await updatePreferences({
        preferred_language: preferredLanguage,
        preferred_mode: preferredMode,
        multilingual_enabled: multilingualEnabled,
      });

      if (response?.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      localStorage.setItem(
        "mlc_preferences_updated_at",
        String(Date.now()),
      );

      setSuccess("Settings saved. New messages will use these preferences.");
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-[#eef2ff] via-[#f5f3ff] to-[#ffe4f0] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6">
        <header className="rounded-xl bg-white p-6 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d28d9]">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-light text-[#0b0b12]">
            Language and Delivery Preferences
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#475569]">
            Changes apply only to new messages. Messages already received keep
            their existing language and format.
          </p>
        </header>

        <form
          onSubmit={handleSave}
          className="rounded-xl bg-white p-6 shadow-lg"
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section>
              <h2 className="text-sm font-semibold text-[#0b0b12]">
                Translation Settings
              </h2>
              <p className="mt-2 text-sm text-[#475569]">
                Choose how incoming messages should be delivered. You can also
                disable multilingual translation to receive original messages
                when both users do the same.
              </p>

              <div className="mt-5 grid gap-4">
                <label className="block text-sm font-semibold text-[#0b0b12]">
                  Preferred language
                  <select
                    value={preferredLanguage}
                    onChange={(event) => setPreferredLanguage(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0b0b12] focus:border-[#6366f1] focus:outline-none"
                  >
                    {LANGUAGE_OPTIONS.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-[#0b0b12]">
                  Preferred mode
                  <select
                    value={preferredMode}
                    onChange={(event) => setPreferredMode(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0b0b12] focus:border-[#6366f1] focus:outline-none"
                  >
                    {modeOptions.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f5f3ff] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={multilingualEnabled}
                    onChange={(event) =>
                      setMultilingualEnabled(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-[#cbd5f5] text-[#6d28d9] focus:ring-[#c7d2fe]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[#0b0b12]">
                      Enable multilingual translation
                    </span>
                    <span className="mt-1 block text-sm text-[#475569]">
                      When both users disable this, messages are delivered in
                      the original language for faster chatting.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <aside className="rounded-lg border border-[#e2e8f0] bg-[#eef2ff] p-5">
              <h3 className="text-sm font-semibold text-[#0b0b12]">
                What happens next
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#475569]">
                <li>
                  New incoming messages will use your selected language and
                  mode.
                </li>
                <li>
                  Messages you already received stay exactly as they are.
                </li>
                <li>
                  Turning off multilingual translation for both users sends
                  original messages without translation.
                </li>
              </ul>
            </aside>
          </div>

          {(error || success) && (
            <div
              className={`mt-5 rounded-lg px-4 py-3 text-sm font-semibold ${
                error
                  ? "bg-red-50 text-red-600"
                  : "bg-[#fce7f3] text-[#be185d]"
              }`}
            >
              {error || success}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className={`rounded-full px-6 py-3 text-sm font-semibold text-white transition ${
                isSaving
                  ? "cursor-not-allowed bg-[#8696a0]"
                  : "bg-gradient-to-r from-[#2563eb] via-[#6d28d9] to-[#be185d]"
              }`}
            >
              {isSaving ? "Saving..." : "Save settings"}
            </button>
            <span className="text-xs text-[#475569]">
              Saved preferences apply immediately for new messages.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
