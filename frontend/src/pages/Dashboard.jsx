import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import { getCurrentUser, logout } from '../services/authService'

export default function Dashboard() {
  const nav = useNavigate()
  const user = getCurrentUser()
  function handleLogout() {
    logout()
    nav('/')
  }
  return (
    <div className="min-h-screen p-6 bg-brand-50">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <span className="text-slate-600 text-sm">{user ? `Logged in: +91 ${user.phone}` : 'Guest'}</span>
            <button className="btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-xl font-extrabold">Your Profile</h3>
            <p className="text-slate-600 mt-2">This is a placeholder dashboard. Replace with real user data.</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-extrabold">Quick Links</h3>
            <div className="mt-3 flex gap-3">
              <Link to="/register" className="btn">New Registration</Link>
              <Link to="/login" className="btn">Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
