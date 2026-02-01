import React from "react";

const Home = () => {
  return (
    <div className="bg-linear-to-br from-blue-100 to-indigo-200 flex justify-center items-center h-[90vh] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url(transchat.png)] opacity-10 bg-cover bg-center"></div>
      <div className="z-10 flex justify-center items-center flex-col w-full max-w-lg bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center mx-4 space-y-6">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
          Multilingual Chat
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          Welcome to the Multilingual Chatting App! Connect with people from
          around the world in your preferred language.
        </p>
        <p className="text-blue-600 font-medium">
          Sign up or log in to start chatting now.
        </p>
      </div>
    </div>
  );
};

export default Home;
