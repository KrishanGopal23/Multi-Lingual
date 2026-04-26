import { requestSpeechAudio, requestSpeechToText } from "./api";
import { resolveSpeechLocale } from "./languageSupport";

let activeAudio = null;
let activeAudioUrl = null;

export function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function supportsSpeechSynthesis() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function supportsSpeechPlayback() {
  return (
    typeof window !== "undefined" &&
    (typeof Audio !== "undefined" || supportsSpeechSynthesis())
  );
}

export function supportsAudioRecording() {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

function cleanupActiveAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }

  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
  }
}

export function stopSpeechPlayback() {
  cleanupActiveAudio();

  if (supportsSpeechSynthesis()) {
    window.speechSynthesis.cancel();
  }
}

export function warmupSpeechSynthesis() {
  if (!supportsSpeechSynthesis()) {
    return;
  }

  window.speechSynthesis.getVoices();
  window.speechSynthesis.resume();
}

function waitForVoices(timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (!supportsSpeechSynthesis()) {
      resolve([]);
      return;
    }

    const existingVoices = window.speechSynthesis.getVoices();

    if (existingVoices.length > 0) {
      resolve(existingVoices);
      return;
    }

    const handleVoicesChanged = () => {
      cleanup();
      resolve(window.speechSynthesis.getVoices());
    };

    const timerId = window.setTimeout(() => {
      cleanup();
      resolve(window.speechSynthesis.getVoices());
    }, timeoutMs);

    const cleanup = () => {
      window.clearTimeout(timerId);
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged,
      );
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      handleVoicesChanged,
    );
  });
}

function findMatchingVoice(voices, locale) {
  if (!voices.length) {
    return null;
  }

  return (
    voices.find((voice) => voice.lang === locale) ||
    voices.find((voice) => voice.lang?.startsWith(locale.split("-")[0])) ||
    null
  );
}

async function speakWithBrowserFallback(cleanText, language) {
  if (!supportsSpeechSynthesis()) {
    throw new Error("Audio playback is not supported in this browser.");
  }

  const locale = resolveSpeechLocale(language);
  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voices = await waitForVoices();
  const matchedVoice = findMatchingVoice(voices, locale);
  const synth = window.speechSynthesis;

  utterance.lang = locale;

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  return new Promise((resolve, reject) => {
    let hasStarted = false;
    let isSettled = false;

    const settle = (handler) => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      handler();
    };

    const startTimeoutId = window.setTimeout(() => {
      if (hasStarted) {
        return;
      }

      synth.cancel();

      settle(() => {
        reject(
          new Error(
            matchedVoice
              ? "Speech playback was blocked by this browser. Click the play button once to enable audio."
              : `No voice for ${locale} is ready in this browser. Try Chrome or Edge, or install that system voice.`,
          ),
        );
      });
    }, 2000);

    utterance.onstart = () => {
      hasStarted = true;
      window.clearTimeout(startTimeoutId);
    };

    utterance.onend = () => {
      window.clearTimeout(startTimeoutId);
      settle(resolve);
    };

    utterance.onerror = () => {
      window.clearTimeout(startTimeoutId);
      settle(() => {
        reject(new Error("Unable to play this message as audio."));
      });
    };

    synth.cancel();
    synth.resume();
    synth.speak(utterance);
  });
}

export async function speakText({ text, language }) {
  const cleanText = text?.trim();

  if (!cleanText) {
    return;
  }

  try {
    cleanupActiveAudio();

    const audioBlob = await requestSpeechAudio(cleanText, language);
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    activeAudio = audio;
    activeAudioUrl = audioUrl;

    await new Promise((resolve, reject) => {
      audio.onended = () => {
        cleanupActiveAudio();
        resolve();
      };

      audio.onerror = () => {
        cleanupActiveAudio();
        reject(new Error("Unable to play generated audio."));
      };

      audio
        .play()
        .then(() => undefined)
        .catch(() => {
          cleanupActiveAudio();
          reject(
            new Error(
              "Audio playback was blocked by this browser. Click the play button once to enable audio.",
            ),
          );
        });
    });
  } catch (error) {
    await speakWithBrowserFallback(cleanText, language).catch(() => {
      throw new Error(
        error?.message || "Unable to play this message as audio.",
      );
    });
  }
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("Unable to encode audio for transcription."));

    reader.readAsDataURL(blob);
  });
}

export async function transcribeAudioBlob(blob, fileName = "voice-message.webm") {
  const audioBase64 = await blobToBase64(blob);
  const response = await requestSpeechToText(
    audioBase64,
    blob.type || "audio/webm",
    fileName,
  );

  const transcript = response.transcript?.trim();

  if (!transcript) {
    throw new Error("No transcript was returned.");
  }

  return transcript;
}

export function getSpeechRecognitionErrorMessage(errorCode) {
  const errors = {
    "audio-capture": "No microphone was detected for voice messages.",
    "network": "Speech recognition could not reach the browser service.",
    "not-allowed": "Microphone permission was denied.",
    "service-not-allowed": "This browser blocked speech recognition.",
    "no-speech": "No speech was detected. Try again.",
    "aborted": "Voice capture was cancelled.",
  };

  return errors[errorCode] || "Voice recognition failed. Please try again.";
}
