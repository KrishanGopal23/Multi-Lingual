import axios from "axios";

// const url = "http://localhost:5000/mlc";
const url = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: url, // Adjust the base URL as needed
  withCredentials: true,
});

const setAuthHeader = () => {
  const token = localStorage.getItem("token");

  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

const refreshAccessToken = async () => {
  const response = await api.post("/auth/refresh");
  if (response.data?.token) {
    localStorage.setItem("token", response.data.token);
  }
  return response.data;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/login") &&
      !originalRequest?.url?.includes("/auth/register") &&
      !originalRequest?.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        await refreshAccessToken();
        setAuthHeader();
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

const registerUser = async (name, email, password, lang, mode) => {
  try {
    const body = {
      name: name,
      email: email,
      password: password,
      preferred_language: lang,
      preferred_mode: mode,
    };

    const response = await api.post("/auth/register", body);

    const token = response.data.token;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(response.data.user));

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const loginUser = async (email, password) => {
  try {
    const body = {
      email: email,
      password: password,
    };
    const response = await api.post("/auth/login", body);
    const token = response.data.token;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const logoutUser = async () => {
  try {
    setAuthHeader();
    await api.post("/user/presence/offline");
    await api.post("/auth/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // if you stored user data
    delete api.defaults.headers.common.Authorization;

    return { success: true };
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const subscribePush = async (subscription) => {
  try {
    setAuthHeader();
    const response = await api.post("/user/push/subscribe", subscription);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const unsubscribePush = async (endpoint) => {
  try {
    setAuthHeader();
    const response = await api.post("/user/push/unsubscribe", { endpoint });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const getUsers = async () => {
  try {
    setAuthHeader();
    const response = await api.get("/user/users");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}

const addFriend = async (friend_id) => {
  try {

    setAuthHeader();
    const response = await api.post(`/user/add/${friend_id}`);
    return response.data;

  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const getFriends = async () => {
  try {
    setAuthHeader();
    const response = await api.get("/user/friends");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const getProfile = async () => {
  try {
    setAuthHeader();
    const response = await api.get("/user/profile");
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const updatePreferences = async (preferences) => {
  try {
    setAuthHeader();
    const response = await api.patch("/user/preferences", preferences);
    if (response.data?.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const sendMessages = async (
  message,
  friend_id,
  inputMode = "Text",
  replyTo = null,
) => {
  try {
    setAuthHeader();

    const body = {
      message,
      input_mode: inputMode,
      reply_to: replyTo,
    };

    const response = await api.post(`/chat/${friend_id}/send`, body);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const sendMediaMessage = async (friend_id, files, message = "", replyTo = null) => {
  try {
    setAuthHeader();

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    if (message) {
      formData.append("message", message);
    }

    if (replyTo) {
      formData.append("reply_to", replyTo);
    }

    const response = await api.post(`/chat/${friend_id}/media`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const getMessages = async (friend_id) => {
  try {
    setAuthHeader();
    const response = await api.get(`/chat/${friend_id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const searchChatMessages = async (friend_id, query = "", mediaKind = "all") => {
  try {
    setAuthHeader();
    const response = await api.get(`/chat/${friend_id}/search`, {
      params: { q: query, media_kind: mediaKind },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const searchGlobalMessages = async (query = "", mediaKind = "all") => {
  try {
    setAuthHeader();
    const response = await api.get("/chat/search", {
      params: { q: query, media_kind: mediaKind },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const markMessagesRead = async (friend_id) => {
  try {
    setAuthHeader();
    const response = await api.post(`/chat/${friend_id}/read`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const heartbeatPresence = async () => {
  try {
    setAuthHeader();
    const response = await api.post("/user/presence/heartbeat");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const getPresence = async (friend_id) => {
  try {
    setAuthHeader();
    const response = await api.get(`/user/presence/${friend_id}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const setTypingStatus = async (friend_id, isTyping) => {
  try {
    setAuthHeader();
    const response = await api.post(`/chat/${friend_id}/typing`, {
      is_typing: isTyping,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const getTypingStatus = async (friend_id) => {
  try {
    setAuthHeader();
    const response = await api.get(`/chat/${friend_id}/typing`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const editMessage = async (message_id, message) => {
  try {
    setAuthHeader();
    const response = await api.patch(`/chat/message/${message_id}/edit`, {
      message,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const deleteMessage = async (message_id, scope = "me") => {
  try {
    setAuthHeader();
    const response = await api.post(`/chat/message/${message_id}/delete`, {
      scope,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const reactToMessage = async (message_id, emoji) => {
  try {
    setAuthHeader();
    const response = await api.post(`/chat/message/${message_id}/react`, {
      emoji,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const forwardMessage = async (friend_id, message_id) => {
  try {
    setAuthHeader();
    const response = await api.post(`/chat/${friend_id}/forward`, {
      message_id,
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const requestSpeechAudio = async (text, language) => {
  try {
    setAuthHeader();
    const response = await api.post(
      "/speech/tts",
      { text, language },
      { responseType: "blob" }
    );
    return response.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const errorText = await error.response.data.text();
      try {
        const parsedError = JSON.parse(errorText);
        throw new Error(parsedError.message || "Speech audio request failed.");
      } catch {
        throw new Error(errorText || "Speech audio request failed.");
      }
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("Network Error");
  }
};

const requestSpeechToText = async (audioBase64, mimeType, fileName) => {
  try {
    setAuthHeader();
    const response = await api.post("/speech/stt", {
      audio_base64: audioBase64,
      mime_type: mimeType,
      file_name: fileName,
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error("Network Error");
  }
};

export {
  registerUser,
  loginUser,
  sendMessages,
  sendMediaMessage,
  getFriends,
  getMessages,
  searchChatMessages,
  searchGlobalMessages,
  getProfile,
  updatePreferences,
  logoutUser,
  addFriend,
  getUsers,
  requestSpeechAudio,
  requestSpeechToText,
  markMessagesRead,
  heartbeatPresence,
  getPresence,
  setTypingStatus,
  getTypingStatus,
  editMessage,
  deleteMessage,
  reactToMessage,
  forwardMessage,
  subscribePush,
  unsubscribePush,
};
