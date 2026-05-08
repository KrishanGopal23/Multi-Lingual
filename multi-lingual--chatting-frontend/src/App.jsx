import React from "react";
import { Route, Routes } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AddFriends from "./pages/AddFriends.jsx";
import Settings from "./pages/Settings.jsx";
import About from "./pages/About.jsx";

const App = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/login" element={<LoginPage />}></Route>
        <Route path="/register" element={<RegisterPage />}></Route>
        <Route path="/about" element={<About />}></Route>

        <Route
          path="/Chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        ></Route>

        <Route
          path="/addfriends"
          element={
            <ProtectedRoute>
              <AddFriends />
            </ProtectedRoute>
          }
        ></Route>

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        ></Route>
      </Routes>
    </div>
  );
};

export default App;
