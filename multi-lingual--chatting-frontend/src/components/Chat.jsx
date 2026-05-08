import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteMessage,
  editMessage,
  forwardMessage,
  getPresence,
  getTypingStatus,
  markMessagesRead,
  reactToMessage,
  sendMediaMessage,
  sendMessages,
  setTypingStatus,
} from "../services/api";
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

const QUEUE_STORAGE_KEY = "mlc_pending_queue";

const readQueuedMessagesFromStorage = () => {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const writeQueuedMessagesToStorage = (queue) => {
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
};

const readPreferencesUpdatedAt = () => {
  if (typeof localStorage === "undefined") {
    return 0;
  }

  const stored = localStorage.getItem("mlc_preferences_updated_at");
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : 0;
};

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
  const [pendingMessages, setPendingMessages] = useState([]);
  const [activePlaybackId, setActivePlaybackId] = useState(null);
  const [presenceInfo, setPresenceInfo] = useState({
    isOnline: false,
    lastSeen: null,
  });
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [openReactionFor, setOpenReactionFor] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isChatMuted, setIsChatMuted] = useState(false);
  const [, setOfflineQueue] = useState(readQueuedMessagesFromStorage);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedFilesRef = useRef([]);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const spokenMessageIdsRef = useRef(new Set());
  const hasInitializedConversationRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const preferencesUpdatedAt = useMemo(() => readPreferencesUpdatedAt(), []);

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
  const currentUserId = currentUserProfile?._id || currentUserProfile?.id || "me";
  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const displayMessages = [
    ...messages,
    ...pendingMessages.filter(
      (item) => item.receiver?.toString() === friendId?.toString(),
    ),
  ].sort((a, b) => {
    const aTime = new Date(a.timestamp || a.createdAt || 0).getTime();
    const bTime = new Date(b.timestamp || b.createdAt || 0).getTime();
    return aTime - bTime;
  });

  const searchableMessages = displayMessages;

  const loadQueue = useCallback(readQueuedMessagesFromStorage, []);

  const enqueueMessage = useCallback((queuedMessage) => {
    setOfflineQueue((current) => {
      const next = [...current, queuedMessage];
      writeQueuedMessagesToStorage(next);
      return next;
    });
  }, []);

  const removeFromQueue = useCallback((clientId) => {
    setOfflineQueue((current) => {
      const next = current.filter((item) => item.client_id !== clientId);
      writeQueuedMessagesToStorage(next);
      return next;
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingQueue || !navigator.onLine) {
      return;
    }

    setIsProcessingQueue(true);

    try {
      const queue = loadQueue();

      for (const item of queue) {
        try {
          await sendMessages(
            item.message,
            item.friend_id,
            item.input_mode,
            item.reply_to,
          );
          removeFromQueue(item.client_id);
          setPendingMessages((current) =>
            current.filter((pending) => pending.client_id !== item.client_id),
          );
        } catch {
          setPendingMessages((current) =>
            current.map((pending) =>
              pending.client_id === item.client_id
                ? { ...pending, status: "failed" }
                : pending,
            ),
          );
        }
      }

      if (queue.length > 0) {
        await refreshMessages();
      }
    } finally {
      setIsProcessingQueue(false);
    }
  }, [isProcessingQueue, loadQueue, refreshMessages, removeFromQueue]);

  const registerBackgroundSync = async () => {
    if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("mlc-sync");
    } catch (error) {
      console.error("Background sync registration failed:", error);
    }
  };

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
    pendingId = null,
    replyTo = null,
    replyPreview = null,
  } = {}) => {
    const trimmedMessage = text.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    if (!navigator.onLine) {
      const offlineId = `offline-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;

      enqueueMessage({
        client_id: offlineId,
        friend_id: friendId,
        message: trimmedMessage,
        input_mode: inputMode,
        reply_to: replyTo,
      });

      setPendingMessages((current) => [
        ...current,
        {
          client_id: offlineId,
          sendar: currentUserProfile?._id || "me",
          receiver: friendId,
          original_message: trimmedMessage,
          translated_message: "",
          input_mode: inputMode,
          sender_language: preferredLanguage,
          receiver_language: friendLanguage,
          reply_to: replyTo,
          reply_preview: replyPreview,
          status: "queued",
          timestamp: new Date().toISOString(),
          isLocal: true,
        },
      ]);

      if (clearTextInput) {
        setMessage("");
      }

      setReplyToMessage(null);
      setSpeechError("You are offline. Message queued.");
      registerBackgroundSync();
      return;
    }

    setIsSending(true);
    setSpeechError("");

    const nextPendingId =
      pendingId ||
      `pending-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    if (!pendingId) {
      setPendingMessages((current) => [
        ...current,
        {
          client_id: nextPendingId,
          sendar: currentUserProfile?._id || "me",
          receiver: friendId,
          original_message: trimmedMessage,
          translated_message: "",
          input_mode: inputMode,
          sender_language: preferredLanguage,
          receiver_language: friendLanguage,
          reply_to: replyTo,
          reply_preview: replyPreview,
          status: "sending",
          timestamp: new Date().toISOString(),
          isLocal: true,
        },
      ]);
    }

    if (clearTextInput) {
      setMessage("");
    }

    try {
      await sendMessages(trimmedMessage, friendId, inputMode, replyTo);
      await refreshMessages();

      setPendingMessages((current) =>
        current.filter((item) => item.client_id !== nextPendingId),
      );

      setVoicePreview("");
      setReplyToMessage(null);
      if (friendId) {
        setTypingStatus(friendId, false).catch((error) => {
          console.error("Failed to clear typing status:", error);
        });
      }
    } catch (error) {
      console.log(error);
      setSpeechError(error.message || "Unable to send your message.");

      setPendingMessages((current) =>
        current.map((item) =>
          item.client_id === nextPendingId
            ? { ...item, status: "failed" }
            : item,
        ),
      );

      if (inputMode === "Audio") {
        setMessage(trimmedMessage);
      }
    } finally {
      setIsSending(false);
    }
  };

  const sendMediaHandler = async () => {
    if (!friendId || isSending) {
      return;
    }

    if (!navigator.onLine) {
      setSpeechError("You are offline. Media cannot be queued yet.");
      return;
    }

    if (selectedFiles.length === 0 && !message.trim()) {
      return;
    }

    setIsSending(true);
    setSpeechError("");

    try {
      await sendMediaMessage(
        friendId,
        selectedFiles.map((item) => item.file),
        message.trim(),
        replyToMessage?.id || null,
      );
      await refreshMessages();
      selectedFiles.forEach((item) => URL.revokeObjectURL(item.preview));
      setSelectedFiles([]);
      setMessage("");
      setReplyToMessage(null);
    } catch (error) {
      setSpeechError(error.message || "Unable to send media.");
    } finally {
      setIsSending(false);
    }
  };

  const retryPendingMessage = async (pendingMessage) => {
    if (!pendingMessage || isSending) {
      return;
    }

    if (!navigator.onLine) {
      setSpeechError("You are offline. Message queued.");
      return;
    }

    setPendingMessages((current) =>
      current.map((item) =>
        item.client_id === pendingMessage.client_id
          ? { ...item, status: "sending" }
          : item,
      ),
    );

    await sendMessageHandler({
      text: pendingMessage.original_message,
      inputMode: pendingMessage.input_mode || "Text",
      clearTextInput: false,
      pendingId: pendingMessage.client_id,
      replyTo: pendingMessage.reply_to || null,
      replyPreview: pendingMessage.reply_preview || null,
    });
  };

  const handleStartReply = (chatMessage, visibleText) => {
    if (!chatMessage?._id) {
      return;
    }

    setEditingMessage(null);
    setReplyToMessage({
      id: chatMessage._id,
      sender: chatMessage.sendar === friendId ? friend?.name || "Friend" : "You",
      text: visibleText,
    });
  };

  const handleStartEdit = (chatMessage, visibleText) => {
    if (!chatMessage?._id) {
      return;
    }

    setReplyToMessage(null);
    setEditingMessage({ id: chatMessage._id, text: visibleText });
    setMessage(visibleText);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !message.trim()) {
      return;
    }

    try {
      await editMessage(editingMessage.id, message.trim());
      setEditingMessage(null);
      setMessage("");
      await refreshMessages();
    } catch (error) {
      setSpeechError(error.message || "Unable to edit the message.");
    }
  };

  const handleDelete = async (chatMessage, scope) => {
    if (!chatMessage?._id) {
      return;
    }

    if (scope === "everyone") {
      const confirmed = window.confirm("Delete this message for everyone?");
      if (!confirmed) {
        return;
      }
    }

    try {
      await deleteMessage(chatMessage._id, scope);
      await refreshMessages();
    } catch (error) {
      setSpeechError(error.message || "Unable to delete the message.");
    }
  };

  const handleForward = async (chatMessage) => {
    if (!chatMessage?._id || !friendId) {
      return;
    }

    try {
      await forwardMessage(friendId, chatMessage._id);
      await refreshMessages();
    } catch (error) {
      setSpeechError(error.message || "Unable to forward the message.");
    }
  };

  const handleReaction = async (chatMessage, emoji) => {
    if (!chatMessage?._id) {
      return;
    }

    try {
      await reactToMessage(chatMessage._id, emoji);
      await refreshMessages();
    } catch (error) {
      setSpeechError(error.message || "Unable to react to the message.");
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
        replyTo: replyToMessage?.id || null,
        replyPreview: replyToMessage,
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
            replyTo: replyToMessage?.id || null,
            replyPreview: replyToMessage,
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
  }, [searchableMessages]);

  useEffect(() => {
    const queue = loadQueue();

    const queuedPending = queue
      .filter((item) => item.friend_id?.toString() === friendId?.toString())
      .map((item) => ({
        client_id: item.client_id,
        sendar: currentUserProfile?._id || "me",
        receiver: item.friend_id,
        original_message: item.message,
        translated_message: "",
        input_mode: item.input_mode,
        sender_language: preferredLanguage,
        receiver_language: friendLanguage,
        reply_to: item.reply_to,
        status: "queued",
        timestamp: new Date().toISOString(),
        isLocal: true,
      }));

    setPendingMessages((current) => {
      const withoutQueued = current.filter((item) => item.status !== "queued");
      return [...withoutQueued, ...queuedPending];
    });
  }, [currentUserProfile?._id, friendId, friendLanguage, loadQueue, preferredLanguage]);

  useEffect(() => {
    const handleOnline = () => {
      processQueue();
    };

    window.addEventListener("online", handleOnline);

    const interval = setInterval(() => {
      if (navigator.onLine) {
        processQueue();
      }
    }, 10000);

    if ("serviceWorker" in navigator) {
      const handler = (event) => {
        if (event?.data?.type === "mlc-sync") {
          processQueue();
        }
      };

      navigator.serviceWorker.addEventListener("message", handler);

      return () => {
        window.removeEventListener("online", handleOnline);
        clearInterval(interval);
        navigator.serviceWorker.removeEventListener("message", handler);
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, [friendId, processQueue]);

  useEffect(() => {
    if (!friendId) {
      return;
    }

    let interval;

    const loadPresence = async () => {
      try {
        const presence = await getPresence(friendId);
        setPresenceInfo({
          isOnline: Boolean(presence.is_online),
          lastSeen: presence.last_seen || null,
        });
      } catch (error) {
        console.error("Presence fetch failed:", error);
      }
    };

    const loadTyping = async () => {
      try {
        const typing = await getTypingStatus(friendId);
        setIsFriendTyping(Boolean(typing.is_typing));
      } catch (error) {
        console.error("Typing fetch failed:", error);
      }
    };

    loadPresence();
    loadTyping();
    interval = setInterval(() => {
      loadPresence();
      loadTyping();
    }, 4000);

    return () => clearInterval(interval);
  }, [friendId]);

  useEffect(() => {
    if (!friendId) {
      return;
    }

    const stored = localStorage.getItem("mlc_muted_chats");
    const mutedIds = stored ? JSON.parse(stored) : [];
    setIsChatMuted(mutedIds.includes(friendId));
  }, [friendId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      selectedFilesRef.current.forEach((item) =>
        URL.revokeObjectURL(item.preview),
      );
    };
  }, []);

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(() => {
    if (!friendId || !messages.length) {
      return;
    }

    const hasUnreadIncoming = messages.some(
      (chatMessage) =>
        chatMessage.sendar === friendId && chatMessage.status !== "read",
    );

    if (!hasUnreadIncoming) {
      return;
    }

    let isCancelled = false;

    markMessagesRead(friendId)
      .then(() => {
        if (!isCancelled) {
          refreshMessages();
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error("Failed to mark messages read:", error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [friendId, messages, refreshMessages]);

  useEffect(() => {
    if (preferredMode !== "Audio" || !speechPlaybackSupported) {
      return;
    }

    const nextIncomingMessage = [...messages].reverse().find((chatMessage) => {
      if (chatMessage.sendar !== friendId) {
        return false;
      }

      if (spokenMessageIdsRef.current.has(chatMessage._id)) {
        return false;
      }

      if (!preferencesUpdatedAt) {
        return true;
      }

      const messageTime = new Date(
        chatMessage.timestamp || chatMessage.createdAt || 0,
      ).getTime();
      return messageTime > preferencesUpdatedAt;
    });

    if (!nextIncomingMessage) {
      return;
    }

    spokenMessageIdsRef.current.add(nextIncomingMessage._id);
    let isCancelled = false;

    setSpeechError("");
    setActivePlaybackId(nextIncomingMessage._id);
    warmupSpeechSynthesis();

    speakText({
      text:
        nextIncomingMessage.translated_message ||
        nextIncomingMessage.original_message,
      language: nextIncomingMessage.receiver_language || preferredLanguage,
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
      if (friendId) {
        setTypingStatus(friendId, false).catch((error) => {
          console.error("Failed to clear typing status:", error);
        });
      }
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
  }, [friendId]);

  const formatLastSeen = (lastSeenValue) => {
    if (!lastSeenValue) {
      return "Offline";
    }

    const lastSeenDate = new Date(lastSeenValue);
    if (Number.isNaN(lastSeenDate.getTime())) {
      return "Offline";
    }

    return `Last seen ${lastSeenDate.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#efeae2]">
      <div className="shrink-0 border-l border-[#d1d7db] bg-[#f0f2f5] px-3 py-2.5 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#54656f] transition hover:bg-[#e2e6e8] lg:hidden"
              aria-label="Back to contacts"
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

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] text-sm font-extrabold text-[#54656f]">
              {getInitials(friend?.name)}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-[#111b21]">
                {friend?.name || "Chat"}
              </h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-medium text-[#667781]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    presenceInfo.isOnline ? "bg-[#00a884]" : "bg-[#8696a0]"
                  }`}
                />
                <span>
                  {presenceInfo.isOnline
                    ? "Online"
                    : formatLastSeen(presenceInfo.lastSeen)}
                </span>
                {isFriendTyping && (
                  <span className="font-medium text-[#008069]">
                    Typing...
                  </span>
                )}
                {isChatMuted && (
                  <span className="text-[#667781]">
                    Muted
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-[#54656f]">
            <span className="hidden max-w-[15rem] truncate rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-[#54656f] xl:inline">
              {receiverLanguageLabel} / {outgoingModeLabel}
            </span>
              <button
                type="button"
                onClick={() => {
                  const stored = localStorage.getItem("mlc_muted_chats");
                  const mutedIds = stored ? JSON.parse(stored) : [];
                  const nextMuted = isChatMuted
                    ? mutedIds.filter((id) => id !== friendId)
                    : [...mutedIds, friendId];
                  localStorage.setItem(
                    "mlc_muted_chats",
                    JSON.stringify(nextMuted),
                  );
                  setIsChatMuted(!isChatMuted);
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#e2e6e8] ${
                  isChatMuted
                    ? "text-[#008069]"
                    : "text-[#54656f]"
                }`}
                title={isChatMuted ? "Unmute chat" : "Mute chat"}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.5 8.5a4.5 4.5 0 010 7M6 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2l5 4V5L8.5 7M4 4l16 16" />
                </svg>
              </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#e2e6e8]"
              title="Conversation details"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6h.01M12 12h.01M12 18h.01" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="wa-chat-wallpaper flex-1 overflow-y-auto border-l border-[#d1d7db] px-3 py-5 sm:px-8">
        <ul className="flex flex-col gap-1.5">
          {searchableMessages && searchableMessages.length > 0 ? (
            searchableMessages.map((chatMessage) => {
              const isIncoming = chatMessage.sendar === friendId;
              const isOwnMessage =
                chatMessage.sendar?.toString() === currentUserId?.toString();
              const isDeletedForAll = Boolean(chatMessage.deleted_for_all);
              const incomingLanguage =
                chatMessage.receiver_language || preferredLanguage;
              const incomingMode = chatMessage.receiver_mode || preferredMode;
              const visibleText = isIncoming
                ? chatMessage.translated_message || chatMessage.original_message
                : chatMessage.original_message;
              const displayText = isDeletedForAll
                ? "Message deleted"
                : visibleText;
              const playbackLanguage = isIncoming
                ? incomingLanguage
                : chatMessage.sender_language || preferredLanguage;
              const messageRoleLabel = isIncoming ? "Translated" : "Original";
              const inputLabel =
                chatMessage.input_mode === "Audio"
                  ? "Voice input"
                  : chatMessage.input_mode === "Media"
                    ? "Media"
                    : "Typed";
              const deliveryDetail = isIncoming
                ? `For you in ${getLanguageLabel(
                    incomingLanguage,
                  )} / ${getModeLabel(incomingMode)}`
                : `${friend?.name || "Receiver"} gets ${getLanguageLabel(
                    friendLanguage || chatMessage.receiver_language,
                  )} / ${outgoingModeLabel}`;
              const statusValue = isIncoming
                ? null
                : chatMessage.status || (chatMessage.isLocal ? "sending" : "sent");
              const statusLabelMap = {
                queued: "Queued",
                sending: "Sending",
                sent: "Sent",
                delivered: "Delivered",
                read: "Read",
                failed: "Failed",
              };
              const statusLabel = statusValue ? statusLabelMap[statusValue] : null;
              const reactionCounts = (chatMessage.reactions || []).reduce(
                (acc, reaction) => {
                  acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                  return acc;
                },
                {},
              );
              const userReaction = (chatMessage.reactions || []).find(
                (reaction) => reaction.user?.toString() === currentUserId,
              );
              const replyMessage = chatMessage.reply_to;
              const replyPreview = chatMessage.reply_preview;
              const replyText = replyMessage
                ? replyMessage.deleted_for_all
                  ? "Message deleted"
                  : replyMessage.sendar === friendId
                    ? replyMessage.translated_message
                    : replyMessage.original_message
                : replyPreview?.text || "";
              const replySenderLabel = replyMessage
                ? replyMessage.sendar === friendId
                  ? friend?.name || "Friend"
                  : "You"
                : replyPreview?.sender || "";

              return (
                <li
                  key={chatMessage._id || chatMessage.client_id}
                  className={`flex py-0.5 ${isIncoming ? "justify-start" : "justify-end"}`}
                >
                  <article
                    className={`group relative max-w-[88%] rounded-lg px-2.5 py-1.5 text-[#111b21] shadow-sm sm:max-w-[62%] ${
                      isIncoming
                        ? "rounded-tl-none bg-white"
                        : "rounded-tr-none bg-[#d9fdd3]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="sr-only">
                          <span
                            className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                          >
                            {messageRoleLabel}
                          </span>
                          <span
                            className="rounded-full px-3 py-1 text-[11px] font-semibold"
                          >
                            {inputLabel}
                          </span>
                        </div>

                        {(replyMessage || replyPreview) && (
                          <div
                            className={`mb-2 rounded-md border-l-4 px-3 py-2 text-xs leading-5 ${
                              isIncoming
                                ? "border-[#00a884] bg-[#f0f2f5] text-[#54656f]"
                                : "border-[#00a884] bg-[#cfeec8] text-[#54656f]"
                            }`}
                          >
                            <span className="font-semibold">
                              Replying to {replySenderLabel}:
                            </span>{" "}
                            {replyText || "Message"}
                          </div>
                        )}

                        {displayText && (
                          <p className="break-words whitespace-pre-wrap text-[14px] leading-5">
                            {displayText}
                          </p>
                        )}

                        {chatMessage.attachments?.length > 0 && !isDeletedForAll && (
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {chatMessage.attachments.map((attachment) => {
                              if (attachment.kind === "image") {
                                return (
                                  <img
                                    key={attachment.url}
                                    src={attachment.url}
                                    alt={attachment.file_name || "Image"}
                                    className="w-full rounded-lg object-cover"
                                  />
                                );
                              }

                              if (attachment.kind === "video") {
                                return (
                                  <video
                                    key={attachment.url}
                                    controls
                                    className="w-full rounded-lg"
                                    src={attachment.url}
                                  />
                                );
                              }

                              if (attachment.kind === "audio") {
                                return (
                                  <audio
                                    key={attachment.url}
                                    controls
                                    className="w-full"
                                    src={attachment.url}
                                  />
                                );
                              }

                              return (
                                <a
                                  key={attachment.url}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`block rounded-lg px-3 py-2 text-sm font-semibold ${
                                    isIncoming
                                      ? "bg-[#f0f2f5] text-[#111b21]"
                                      : "bg-[#cfeec8] text-[#111b21]"
                                  }`}
                                >
                                  {attachment.file_name || "Download file"}
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {(chatMessage.forwarded_from || chatMessage.forwarded_from === 0) && (
                          <p
                            className={`mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                              isIncoming ? "text-[#8696a0]" : "text-[#667781]"
                            }`}
                          >
                            Forwarded
                          </p>
                        )}

                        <p
                          className="sr-only"
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
                            chatMessage._id || chatMessage.client_id,
                            displayText,
                            playbackLanguage,
                          )
                        }
                        disabled={!speechPlaybackSupported || isDeletedForAll || !displayText}
                        className={`-mr-1 -mt-1 shrink-0 rounded-full p-1 opacity-0 transition-all group-hover:opacity-100 group-focus-within:opacity-100 ${
                          isIncoming
                            ? "text-[#54656f] hover:bg-[#f0f2f5]"
                            : "text-[#54656f] hover:bg-[#cfeec8]"
                        } ${
                          !speechPlaybackSupported || isDeletedForAll
                            ? "cursor-not-allowed opacity-40"
                            : ""
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

                    {!isDeletedForAll && !chatMessage.isLocal && (
                      <div
                        className={`absolute bottom-full z-20 mb-1 flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-1 text-[#54656f] shadow-lg ring-1 ring-black/5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${
                          isIncoming ? "left-1" : "right-1"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleStartReply(chatMessage, displayText)}
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold hover:bg-[#f0f2f5]"
                        >
                          Reply
                        </button>
                        {!isIncoming && isOwnMessage && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(chatMessage, displayText)}
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold hover:bg-[#f0f2f5]"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleForward(chatMessage)}
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold hover:bg-[#f0f2f5]"
                        >
                          Forward
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenReactionFor(
                              openReactionFor === chatMessage._id
                                ? null
                              : chatMessage._id,
                            )
                          }
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold hover:bg-[#f0f2f5]"
                        >
                          {userReaction?.emoji || "React"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(chatMessage, "me")}
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold hover:bg-[#f0f2f5]"
                        >
                          Delete
                        </button>
                        {!isIncoming && isOwnMessage && (
                          <button
                            type="button"
                            onClick={() => handleDelete(chatMessage, "everyone")}
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold hover:bg-[#f0f2f5]"
                          >
                            Delete all
                          </button>
                        )}
                      </div>
                    )}

                    {openReactionFor === chatMessage._id && (
                      <div
                        className={`absolute bottom-full z-30 mb-10 flex gap-1.5 rounded-full bg-white px-2 py-1.5 shadow-xl ring-1 ring-black/5 ${
                          isIncoming ? "left-1" : "right-1"
                        }`}
                      >
                        {quickReactions.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReaction(chatMessage, emoji)}
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all ${
                              userReaction?.emoji === emoji
                                ? "bg-[#00a884] text-white"
                                : "text-[#111b21] hover:bg-[#f0f2f5]"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      className={`mt-0.5 flex flex-wrap items-center justify-end gap-1.5 text-[10.5px] font-medium ${
                        isIncoming ? "text-[#8696a0]" : "text-[#667781]"
                      }`}
                    >
                      {Object.entries(reactionCounts).map(([emoji, count]) => (
                        <span
                          key={`${chatMessage._id}-${emoji}`}
                          className="rounded-full bg-white/55 px-1.5 py-0.5 text-[10px] leading-none text-[#54656f]"
                        >
                          {emoji} {count}
                        </span>
                      ))}
                      {chatMessage.edited_at && !isDeletedForAll && (
                        <span className="uppercase tracking-[0.18em]">Edited</span>
                      )}
                      {!isIncoming && statusLabel && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            statusValue === "failed"
                              ? "bg-red-100 text-red-600"
                              : "text-[#667781]"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      )}
                      {!isIncoming && statusValue === "failed" && (
                        <button
                          type="button"
                          onClick={() => retryPendingMessage(chatMessage)}
                          className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-semibold text-red-600"
                        >
                          Retry
                        </button>
                      )}
                      {formatMessageTime(
                        chatMessage.timestamp || chatMessage.createdAt,
                      )}
                    </div>
                  </article>
                </li>
              );
            })
          ) : (
            <div className="flex h-full items-center justify-center px-6 py-16 text-center">
              <div className="max-w-md">
                <p className="text-xl font-semibold text-[#111b21]">
                  No messages yet
                </p>
                <p className="mt-3 text-sm leading-7 text-[#667781]">
                  {`Send your first message in ${senderLanguageLabel}. The receiver will get it translated into ${receiverLanguageLabel} with ${outgoingModeLabel.toLowerCase()} delivery.`}
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ul>
      </div>

      <form
        className="shrink-0 border-l border-[#d1d7db] bg-[#f0f2f5] px-3 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (editingMessage) {
            handleSaveEdit();
            return;
          }

          if (selectedFiles.length > 0) {
            sendMediaHandler();
            return;
          }

          sendMessageHandler({
            replyTo: replyToMessage?.id || null,
            replyPreview: replyToMessage,
          });
        }}
      >
        {(replyToMessage || editingMessage) && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border-l-4 border-[#00a884] bg-white px-3 py-2 text-sm text-[#54656f]">
            <div>
              {editingMessage ? (
                <span className="font-semibold text-[#111b21]">
                  Editing message
                </span>
              ) : (
                <span className="font-semibold text-[#111b21]">
                  Replying to {replyToMessage?.sender}
                </span>
              )}
              <p className="mt-1 text-xs text-[#667781]">
                {editingMessage ? editingMessage.text : replyToMessage?.text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setReplyToMessage(null);
                setEditingMessage(null);
                setMessage("");
              }}
              className="rounded-full bg-[#f0f2f5] px-3 py-1 text-xs font-semibold text-[#54656f]"
            >
              Cancel
            </button>
          </div>
        )}
        {(voicePreview || speechError) && (
          <div className="mb-2 space-y-2">
            {voicePreview && (
              <div className="rounded-lg bg-[#d9fdd3] px-3 py-2 text-sm font-medium text-[#111b21]">
                Voice preview: {voicePreview}
              </div>
            )}
            {speechError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                {speechError}
              </div>
            )}
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedFiles.map((item) => (
              <div
                key={`${item.file.name}-${item.file.size}`}
                className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5"
              >
                <div className="h-8 w-8 overflow-hidden rounded-lg bg-[#f0f2f5]">
                  {item.file.type.startsWith("image/") ? (
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[#54656f]">
                      {item.file.type.startsWith("video/")
                        ? "VID"
                        : item.file.type.startsWith("audio/")
                          ? "AUD"
                          : "FILE"}
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold text-[#54656f]">
                  <p className="max-w-[160px] truncate">{item.file.name}</p>
                  <p className="text-[11px] text-[#8696a0]">
                    {(item.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedFiles((current) => {
                      const next = current.filter((entry) => entry !== item);
                      URL.revokeObjectURL(item.preview);
                      return next;
                    })
                  }
                  className="rounded-full bg-[#f0f2f5] px-2 py-1 text-[11px] font-semibold text-[#54656f]"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              const nextFiles = Array.from(event.target.files || []).map(
                (file) => ({ file, preview: URL.createObjectURL(file) }),
              );
              if (nextFiles.length) {
                setSelectedFiles((current) => [...current, ...nextFiles]);
              }
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#54656f] transition hover:bg-[#e2e6e8]"
            title="Attach files"
          >
            <svg
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16.5 12.75l-5.25 5.25a3 3 0 01-4.243-4.243l7.5-7.5a2.25 2.25 0 013.182 3.182l-7.5 7.5a.75.75 0 01-1.06-1.06l6.97-6.97"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            disabled={!voiceInputSupported || isSending}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
              isRecording
                ? "bg-[#dc3545] text-white"
                : "text-[#54656f] hover:bg-[#e2e6e8]"
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
              className="h-[18px] w-[18px]"
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

          <div className="min-w-0 flex-1 rounded-full bg-white px-1 py-0.5 shadow-sm">
            <input
              type="text"
              placeholder={
                isRecording
                  ? "Listening for your voice message..."
                  : editingMessage
                    ? "Edit your message"
                    : "Message"
              }
              className="w-full bg-transparent px-3 py-2 text-sm text-[#111b21] outline-none placeholder:text-[#667781]"
              value={message}
              onChange={(event) => {
                const nextValue = event.target.value;
                setMessage(nextValue);

                if (!friendId) {
                  return;
                }

                setTypingStatus(friendId, nextValue.trim().length > 0).catch(
                  (error) => {
                    console.error("Failed to set typing status:", error);
                  },
                );

                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }

                typingTimeoutRef.current = setTimeout(() => {
                  setTypingStatus(friendId, false).catch((error) => {
                    console.error("Failed to clear typing status:", error);
                  });
                }, 1800);
              }}
              disabled={isSending}
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition ${
              isSending
                ? "cursor-not-allowed bg-[#8696a0]"
                : "bg-[#00a884] hover:bg-[#008069]"
            }`}
          >
            <svg
              className="h-[18px] w-[18px] translate-x-0.5"
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
