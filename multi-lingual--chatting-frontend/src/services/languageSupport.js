export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English", speechLocale: "en-US" },
  { code: "hi", label: "Hindi", speechLocale: "hi-IN" },
  { code: "es", label: "Spanish", speechLocale: "es-ES" },
  { code: "fr", label: "French", speechLocale: "fr-FR" },
  { code: "it", label: "Italian", speechLocale: "it-IT" },
  { code: "de", label: "German", speechLocale: "de-DE" },
  { code: "ja", label: "Japanese", speechLocale: "ja-JP" },
  { code: "ko", label: "Korean", speechLocale: "ko-KR" },
  { code: "ru", label: "Russian", speechLocale: "ru-RU" },
  { code: "zh-CN", label: "Simplified Chinese", speechLocale: "zh-CN" },
  { code: "zh-TW", label: "Traditional Chinese", speechLocale: "zh-TW" },
  { code: "ar", label: "Arabic", speechLocale: "ar-SA" },
  { code: "bn", label: "Bangla", speechLocale: "bn-BD" },
  { code: "te", label: "Telugu", speechLocale: "te-IN" },
  { code: "sa", label: "Sanskrit", speechLocale: "hi-IN" },
  { code: "mr", label: "Marathi", speechLocale: "mr-IN" },
  { code: "ta", label: "Tamil", speechLocale: "ta-IN" },
  { code: "gu", label: "Gujarati", speechLocale: "gu-IN" },
  { code: "kn", label: "Kannada", speechLocale: "kn-IN" },
  { code: "ml", label: "Malayalam", speechLocale: "ml-IN" },
  { code: "or", label: "Odia", speechLocale: "or-IN" },
  { code: "pa", label: "Punjabi", speechLocale: "pa-IN" },
  { code: "as", label: "Assamese", speechLocale: "as-IN" },
  { code: "ne", label: "Nepali", speechLocale: "ne-NP" },
  { code: "ur", label: "Urdu", speechLocale: "ur-PK" },
  { code: "bho", label: "Bhojpuri", speechLocale: "hi-IN" },
];

const languageMap = Object.fromEntries(
  LANGUAGE_OPTIONS.map((language) => [language.code, language])
);

const deliveryModeLabels = {
  Audio: "Audio",
  Text: "Text",
  None: "Flexible",
};

export function getLanguageLabel(code) {
  return languageMap[code]?.label || code || "Unknown";
}

export function resolveSpeechLocale(code) {
  return languageMap[code]?.speechLocale || code || "en-US";
}

export function getModeLabel(mode) {
  return deliveryModeLabels[mode] || "Text";
}
