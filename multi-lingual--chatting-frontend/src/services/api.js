import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/mlc", // Adjust the base URL as needed
});

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

const loginUser = async (username, password) => {
  try {
    const body = {
      email: username,
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

    return { success: true };
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const getUsers = async () => {
  try {
    const token = localStorage.getItem("token");
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const response = await api.get("/user/users");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
}

const addFriend = async (friend_id) => {
  try {

    const token = localStorage.getItem("token");
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const response = await api.post(`/user/add/${friend_id}`);
    return response.data;

  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const getFriends = async () => {
  try {
    // add token
    const token = localStorage.getItem("token");
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const response = await api.get("/user/friends");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const sendMessages = async (message, friend_id) => {
  try {
    const body = {
      message: message,
    };

    const response = await api.post(`/chat/${friend_id}/send`, body);
    console.log(response);
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};

const getMessages = async (friend_id) => {
  try {
    const token = localStorage.getItem("token");
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const response = await api.get(`/chat/${friend_id}`);
    console.log(response.data.message);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network Error");
  }
};
export {
  registerUser,
  loginUser,
  sendMessages,
  getFriends,
  getMessages,
  logoutUser,
  addFriend,
  getUsers,
};
