import axios from "axios";

const url = "http://localhost:5000/mlc";
// const url = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: url, // Adjust the base URL as needed
});

const setAuthHeader = () => {
  const token = localStorage.getItem("token");

  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

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
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // if you stored user data
    delete api.defaults.headers.common.Authorization;

    return { success: true };
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

const sendMessages = async (message, friend_id, inputMode = "Text") => {
  try {
    setAuthHeader();

    const body = {
      message,
      input_mode: inputMode,
    };

    const response = await api.post(`/chat/${friend_id}/send`, body);
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
  getFriends,
  getMessages,
  getProfile,
  logoutUser,
  addFriend,
  getUsers,
  requestSpeechAudio,
  requestSpeechToText,
};
