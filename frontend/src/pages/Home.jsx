import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-blue-600">Welcome to Online Voting</h1>
      <div className="space-x-4">
        <Link
          to="/register"
          className="bg-blue-500 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-600"
        >
          Register
        </Link>
        <Link
          to="/login"
          className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-md hover:bg-green-600"
        >
          Login
        </Link>
      </div>
    </div>
  );
}

export default Home;


