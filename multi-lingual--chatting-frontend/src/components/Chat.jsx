import React, { useEffect, useRef, useState } from "react";
import { sendMessages } from "../services/api";
import {
  getLanguageLabel,
  getModeLabel,
  resolveSpeechLocale,
} from "../services/languageSupport";
import {
  getSpeechRecognitionConstructor,
  getSpeechRecognitionErrorMessage,
  speakText,
  stopSpeechPlayback,
  supportsAudioRecording,
  supportsSpeechPlayback,
  warmupSpeechSynthesis,
  transcribeAudioBlob,
} from "../services/speech";

const formatMessageTime = (timestamp) => {
  const value = timestamp ? new Date(timestamp) : new Date();

  return value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name = "U") =>
  name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

const Chat = ({
  messages,
  friendId,
  friend,
  currentUserProfile,
  onBack,
  refreshMessages,
}) => {
  const [message, setMessage] = useState("");
  const [voicePreview, setVoicePreview] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activePlaybackId, setActivePlaybackId] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const spokenMessageIdsRef = useRef(new Set());
  const hasInitializedConversationRef = useRef(false);

  const preferredLanguage = currentUserProfile?.preferred_language || "en";
  const preferredMode = currentUserProfile?.preferred_mode || "Text";
  const friendLanguage = friend?.preferred_language || "en";
  const friendMode = friend?.preferred_mode || "Text";
  const SpeechRecognition = getSpeechRecognitionConstructor();
  const speechRecognitionSupported = Boolean(SpeechRecognition);
  const audioRecordingSupported = supportsAudioRecording();
  const speechPlaybackSupported = supportsSpeechPlayback();
  const voiceInputSupported =
    audioRecordingSupported || speechRecognitionSupported;

  const senderLanguageLabel = getLanguageLabel(preferredLanguage);
  const receiverLanguageLabel = getLanguageLabel(friendLanguage);
  const incomingModeLabel = getModeLabel(preferredMode);
  const outgoingModeLabel = getModeLabel(friendMode);

  const cleanupMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    mediaRecorderRef.current = null;
  };

  const stopVoiceRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const playMessageAudio = async (messageId, text, language) => {
    if (!speechPlaybackSupported) {
      setSpeechError("Audio playback is not supported in this browser.");
      return;
    }

    if (activePlaybackId === messageId) {
      stopSpeechPlayback();
      setActivePlaybackId(null);
      return;
    }

    setSpeechError("");
    setActivePlaybackId(messageId);
    warmupSpeechSynthesis();

    try {
      await speakText({ text, language });
    } catch (error) {
      setSpeechError(error.message);
    } finally {
      setActivePlaybackId((currentId) =>
        currentId === messageId ? null : currentId,
      );
    }
  };

  const sendMessageHandler = async ({
    text = message,
    inputMode = "Text",
    clearTextInput = true,
  } = {}) => {
    const trimmedMessage = text.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    setIsSending(true);
    setSpeechError("");

    try {
      await sendMessages(trimmedMessage, friendId, inputMode);
      await refreshMessages();

      if (clearTextInput) {
        setMessage("");
      }

      setVoicePreview("");
    } catch (error) {
      console.log(error);
      setSpeechError(error.message || "Unable to send your message.");

      if (inputMode === "Audio") {
        setMessage(trimmedMessage);
      }
    } finally {
      setIsSending(false);
    }
  };

  const runBrowserSpeechRecognition = () => {
    if (!speechRecognitionSupported) {
      setSpeechError("Voice input is not supported in this browser.");
      return;
    }

    if (isSending) {
      return;
    }

    setSpeechError("");
    setVoicePreview("");

    const recognition = new SpeechRecognition();
    let finalTranscript = "";

    recognition.lang = resolveSpeechLocale(preferredLanguage);
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      recognitionRef.current = recognition;
    };

    recognition.onresult = (event) => {
      let spokenText = "";

      for (const result of Array.from(event.results)) {
        spokenText += `${result[0]?.transcript || ""} `;
      }

      finalTranscript = spokenText.trim();
      setVoicePreview(finalTranscript);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setSpeechError(getSpeechRecognitionErrorMessage(event.error));
      }
    };

    recognition.onend = async () => {
      setIsRecording(false);
      recognitionRef.current = null;

      const spokenMessage = finalTranscript.trim();

      if (!spokenMessage) {
        return;
      }

      await sendMessageHandler({
        text: spokenMessage,
        inputMode: "Audio",
        clearTextInput: false,
      });
    };

    try {
      warmupSpeechSynthesis();
      recognition.start();
    } catch {
      setIsRecording(false);
      recognitionRef.current = null;
      setSpeechError("Voice recognition could not be started.");
    }
  };

  const startVoiceRecording = async () => {
    if (!voiceInputSupported) {
      setSpeechError("Voice input is not supported in this browser.");
      return;
    }

    if (isSending) {
      return;
    }

    if (!audioRecordingSupported) {
      runBrowserSpeechRecognition();
      return;
    }

    setSpeechError("");
    setVoicePreview("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus",
      )
        ? "audio/webm;codecs=opus"
        : "";
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);
      const chunks = [];

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.onstart = () => {
        setIsRecording(true);
        setVoicePreview("Recording voice message...");
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onerror = () => {
        cleanupMediaStream();
        setIsRecording(false);

        if (speechRecognitionSupported) {
          setSpeechError(
            "Audio recording API failed. Falling back to browser voice recognition.",
          );
          runBrowserSpeechRecognition();
          return;
        }

        setSpeechError("Unable to capture your voice message.");
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        cleanupMediaStream();

        if (!chunks.length) {
          setVoicePreview("");
          return;
        }

        const audioBlob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });

        setVoicePreview("Transcribing voice message...");

        try {
          const transcript = await transcribeAudioBlob(
            audioBlob,
            `voice-message.${audioBlob.type.includes("mpeg") ? "mp3" : "webm"}`,
          );

          setVoicePreview(transcript);

          await sendMessageHandler({
            text: transcript,
            inputMode: "Audio",
            clearTextInput: false,
          });
        } catch (error) {
          setVoicePreview("");

          if (speechRecognitionSupported) {
            setSpeechError(
              "STT API is unavailable right now. Falling back to browser voice recognition.",
            );
            runBrowserSpeechRecognition();
            return;
          }

          setSpeechError(
            error.message || "Unable to transcribe your voice message.",
          );
        }
      };

      recorder.start();
    } catch {
      cleanupMediaStream();

      if (speechRecognitionSupported) {
        setSpeechError(
          "Microphone recording was not available. Falling back to browser voice recognition.",
        );
        runBrowserSpeechRecognition();
        return;
      }

      setSpeechError("Unable to start voice recording.");
    }
  };

  useEffect(() => {
    if (hasInitializedConversationRef.current) {
      return;
    }

    spokenMessageIdsRef.current = new Set(
      messages
        .filter((chatMessage) => chatMessage.sendar === friendId)
        .map((chatMessage) => chatMessage._id),
    );
    hasInitializedConversationRef.current = true;
  }, [friendId, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (preferredMode !== "Audio" || !speechPlaybackSupported) {
      return;
    }

    const nextIncomingMessage = [...messages]
      .reverse()
      .find(
        (chatMessage) =>
          chatMessage.sendar === friendId &&
          !spokenMessageIdsRef.current.has(chatMessage._id),
      );

    if (!nextIncomingMessage) {
      return;
    }

    spokenMessageIdsRef.current.add(nextIncomingMessage._id);
    let isCancelled = false;

    setSpeechError("");
    setActivePlaybackId(nextIncomingMessage._id);
    warmupSpeechSynthesis();

    speakText({
      text: nextIncomingMessage.translated_message,
      language: preferredLanguage || nextIncomingMessage.receiver_language,
    })
      .catch((error) => {
        if (!isCancelled) {
          spokenMessageIdsRef.current.delete(nextIncomingMessage._id);
          setSpeechError(error.message);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setActivePlaybackId((currentId) =>
            currentId === nextIncomingMessage._id ? null : currentId,
          );
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [friendId, messages, preferredLanguage, preferredMode, speechPlaybackSupported]);

  useEffect(() => {
    warmupSpeechSynthesis();
  }, []);

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      cleanupMediaStream();

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      stopSpeechPlayback();
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-[#fffdf9]/88 shadow-2xl shadow-slate-300/20 backdrop-blur">
      <div className="relative overflow-hidden border-b border-[#efe6d7] bg-[linear-gradient(135deg,#fff9ef_0%,#f6efe2_48%,#eef4f2_100%)] px-5 py-5 sm:px-6">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#1f4f46]/8 blur-3xl" />
        <div className="absolute bottom-0 left-12 h-24 w-24 rounded-full bg-[#d7b06f]/16 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={onBack}
              className="rounded-2xl border border-white/70 bg-white/80 p-3 text-slate-600 shadow-sm transition-all hover:text-slate-900 lg:hidden"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-[#1f4f46] text-lg font-extrabold text-white shadow-lg shadow-[#1f4f46]/20">
              {getInitials(friend?.name)}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a6b38]">
                Active Conversation
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                {friend?.name || "Chat"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                You see your original message. {friend?.name || "Your friend"}{" "}
                receives the translated version in{" "}
                <span className="font-semibold text-slate-900">
                  {receiverLanguageLabel}
                </span>{" "}
                with <span className="font-semibold text-slate-900">{outgoingModeLabel}</span>{" "}
                delivery.
              </p>
            </div>
          </div>

          <div className="hidden flex-wrap gap-2 xl:flex">
            <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#1f4f46] shadow-sm">
              You send in {senderLanguageLabel}
            </span>
            <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#8a6b38] shadow-sm">
              You receive in {getLanguageLabel(preferredLanguage)} / {incomingModeLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-[#efe6d7] bg-[#fcfaf5] px-5 py-4 sm:grid-cols-2 sm:px-6">
        <div className="rounded-[1.4rem] border border-[#e7efe9] bg-[#eef4f2] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1f4f46]">
            Sender View
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            Your bubble keeps the original wording you typed or spoke, such as
            <span className="font-semibold text-slate-900"> "Hi"</span>.
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-[#f2e7cf] bg-[#fff4df] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6b38]">
            Receiver View
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            {friend?.name || "Your friend"} receives the translated version, for
            example
            <span className="font-semibold text-slate-900"> "Namaste"</span>,
            in {receiverLanguageLabel} with {outgoingModeLabel.toLowerCase()} delivery.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(31,79,70,0.05),transparent_30%),linear-gradient(180deg,#fcfaf5_0%,#f7f2e8_100%)] px-4 py-5 sm:px-6">
        <ul className="flex flex-col gap-4">
          {messages && messages.length > 0 ? (
            messages.map((chatMessage) => {
              const isIncoming = chatMessage.sendar === friendId;
              const visibleText = isIncoming
                ? chatMessage.translated_message
                : chatMessage.original_message;
              const playbackLanguage = isIncoming
                ? preferredLanguage || chatMessage.receiver_language
                : chatMessage.sender_language || preferredLanguage;
              const messageRoleLabel = isIncoming ? "Translated" : "Original";
              const inputLabel =
                chatMessage.input_mode === "Audio" ? "Voice input" : "Typed";
              const deliveryDetail = isIncoming
                ? `For you in ${getLanguageLabel(
                    preferredLanguage || chatMessage.receiver_language,
                  )} / ${incomingModeLabel}`
                : `${friend?.name || "Receiver"} gets ${getLanguageLabel(
                    friendLanguage || chatMessage.receiver_language,
                  )} / ${outgoingModeLabel}`;

              return (
                <li
                  key={chatMessage._id}
                  className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}
                >
                  <article
                    className={`max-w-[92%] rounded-[1.8rem] border px-4 py-4 shadow-lg sm:max-w-[72%] ${
                      isIncoming
                        ? "rounded-tl-md border-white/70 bg-white text-slate-800 shadow-slate-200/45"
                        : "rounded-tr-md border-[#1f4f46]/10 bg-[#1f4f46] text-white shadow-[#1f4f46]/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                              isIncoming
                                ? "bg-[#f6efe2] text-[#8a6b38]"
                                : "bg-white/15 text-white"
                            }`}
                          >
                            {messageRoleLabel}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                              isIncoming
                                ? "bg-[#eef4f2] text-[#1f4f46]"
                                : "bg-white/10 text-[#d7e7df]"
                            }`}
                          >
                            {inputLabel}
                          </span>
                        </div>

                        <p className="mt-4 break-words text-[15px] leading-8 sm:text-base">
                          {visibleText}
                        </p>

                        <p
                          className={`mt-4 text-xs leading-6 ${
                            isIncoming ? "text-slate-500" : "text-[#d7e7df]"
                          }`}
                        >
                          {isIncoming
                            ? "Translated copy shown to you."
                            : "Original copy shown to you."}{" "}
                          {deliveryDetail}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          playMessageAudio(
                            chatMessage._id,
                            visibleText,
                            playbackLanguage,
                          )
                        }
                        disabled={!speechPlaybackSupported}
                        className={`shrink-0 rounded-2xl p-3 transition-all ${
                          isIncoming
                            ? "bg-[#f6efe2] text-[#8a6b38] hover:bg-[#efe3ca]"
                            : "bg-white/12 text-white hover:bg-white/18"
                        } ${
                          !speechPlaybackSupported
                            ? "cursor-not-allowed opacity-40"
                            : "shadow-sm"
                        }`}
                        title="Play message audio"
                      >
                        {activePlaybackId === chatMessage._id ? (
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6 4.5A1.5 1.5 0 018.25 3.2l7 4.3a1.5 1.5 0 010 2.55l-7 4.3A1.5 1.5 0 016 13.05V4.5z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div
                      className={`mt-4 flex items-center justify-end text-[11px] font-medium ${
                        isIncoming ? "text-slate-400" : "text-[#d7e7df]"
                      }`}
                    >
                      {formatMessageTime(
                        chatMessage.timestamp || chatMessage.createdAt,
                      )}
                    </div>
                  </article>
                </li>
              );
            })
          ) : (
            <div className="flex h-full items-center justify-center rounded-[1.8rem] border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
              <div className="max-w-md">
                <p className="text-xl font-extrabold text-slate-900">
                  No messages yet
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Send your first message in {senderLanguageLabel}. The receiver
                  will get it translated into {receiverLanguageLabel} with{" "}
                  {outgoingModeLabel.toLowerCase()} delivery.
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ul>
      </div>

      <form
        className="border-t border-[#efe6d7] bg-white/90 px-5 py-5 sm:px-6"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessageHandler();
        }}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#eef4f2] px-3 py-2 text-xs font-semibold text-[#1f4f46]">
            You send in {senderLanguageLabel}
          </span>
          <span className="rounded-full bg-[#fff4df] px-3 py-2 text-xs font-semibold text-[#8a6b38]">
            {friend?.name || "Receiver"} gets {receiverLanguageLabel} / {outgoingModeLabel}
          </span>
        </div>

        {(voicePreview || speechError) && (
          <div className="mb-4 space-y-2">
            {voicePreview && (
              <div className="rounded-2xl border border-[#d7e7df] bg-[#eef4f2] px-4 py-3 text-sm font-medium text-[#1f4f46]">
                Voice preview: {voicePreview}
              </div>
            )}
            {speechError && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {speechError}
              </div>
            )}
          </div>
        )}

        <div className="flex items-end gap-3">
          <button
            type="button"
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            disabled={!voiceInputSupported || isSending}
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] shadow-lg transition-all ${
              isRecording
                ? "bg-[#c04b40] text-white shadow-[#c04b40]/20 hover:bg-[#a93e35]"
                : "bg-[#f6efe2] text-[#8a6b38] shadow-[#d7b06f]/10 hover:-translate-y-0.5 hover:bg-[#efe3ca]"
            } ${
              !voiceInputSupported || isSending
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
            title={
              voiceInputSupported
                ? isRecording
                  ? "Stop recording"
                  : "Record a voice message"
                : "Voice input is not supported in this browser"
            }
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 18.5a5 5 0 005-5V8a5 5 0 10-10 0v5.5a5 5 0 005 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 10.5v3a7 7 0 01-14 0v-3M12 20v2M8 22h8"
              />
            </svg>
          </button>

          <div className="flex-1 rounded-[1.6rem] border border-slate-200 bg-[#fcfaf5] p-2 shadow-sm">
            <input
              type="text"
              placeholder={
                isRecording
                  ? "Listening for your voice message..."
                  : `Type in ${senderLanguageLabel}. ${friend?.name || "Receiver"} gets ${receiverLanguageLabel}.`
              }
              className="w-full bg-transparent px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={isSending}
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] text-white shadow-lg transition-all ${
              isSending
                ? "cursor-not-allowed bg-slate-400"
                : "bg-[#1f4f46] shadow-[#1f4f46]/20 hover:-translate-y-0.5 hover:bg-[#173d37]"
            }`}
          >
            <svg
              className="h-5 w-5 translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
