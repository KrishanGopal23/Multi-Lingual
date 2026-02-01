import React from "react";

const Home = () => {
  return (
    <div className="bg-blue-200 flex justify-center items-center h-[90vh] bg-[url(transchat.png)] opacity-50 bg-cover">
      <div className="h-[50%] flex justify-center items-center flex-col w-[30%] bg-white rounded-xl shadow-lg p-4 text-center ">
        <h1 className="text-3xl font-bold mb-4">Multilingual Chatting App</h1>
        <p className="text-lg text-gray-700">
          Welcome to the Multilingual Chatting App! Connect with people from
          around the world in your preferred language. <br />
          Sign up or log in to start chatting now.
        </p>
      </div>
    </div>
  );
};

export default Home;

