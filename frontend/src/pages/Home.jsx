import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen grid place-items-center bg-brand-50 p-6">
      <div className="w-full max-w-md card text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to iBallot</h1>
        <p className="mb-6 text-slate-600">Choose an option below:</p>

        <div className="space-y-3">
          <Link to="/register" className="btn btn-primary w-full">
            Register
          </Link>
          <Link to="/login" className="btn btn-secondary w-full">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

