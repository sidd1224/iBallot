import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import OTPInput from '../components/OTPInput'
import { isValidPhone } from '../utils/validators'
import { sendOTP, verifyOTP } from '../services/otpService'
import { loginUser, setCurrentUser } from '../services/authService'

export default function Login() {
  const nav = useNavigate()
  const [phone, setPhone] = useState('')
  const [aadhaarLast4, setAadhaarLast4] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverOTP, setServerOTP] = useState('') // demo only

  async function handleSendOTP() {
    if (!isValidPhone(phone)) {
      alert('Enter valid 10-digit phone')
      return
    }
    setLoading(true)
    const res = await sendOTP(phone)
    setLoading(false)
    if (res?.success) {
      setOtpSent(true)
      setServerOTP(res.otp) // demo only
    } else {
      alert('Failed to send OTP')
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!isValidPhone(phone)) {
      alert('Enter valid phone number')
      return
    }
    if (otp.length !== 6) {
      alert('Enter 6-digit OTP')
      return
    }
    if (aadhaarLast4.length !== 4) {
      alert('Enter last 4 digits of Aadhaar')
      return
    }
    if (!password) {
      alert('Enter password')
      return
    }

    setLoading(true)
    const ok = await verifyOTP(phone, otp)
    setLoading(false)
    if (!ok) {
      alert('Invalid OTP')
      return
    }

    try {
      loginUser({ phone, aadhaarLast4, password })
      setCurrentUser(phone)
      nav('/dashboard')
    } catch (err) {
      alert(err.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-brand-50">
      <div className="w-full max-w-xl card">
        <div className="flex items-center justify-between">
          <BrandLogo />
        </div>

        <h2 className="mt-6 text-2xl font-extrabold">Login</h2>

        <form className="mt-6 space-y-5" onSubmit={handleLogin}>
          <div>
            <p className="label">Phone Number</p>
            <div className="flex gap-2">
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                placeholder="10-digit mobile"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSendOTP}
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Get OTP'}
              </button>
            </div>
          </div>

          {otpSent && (
            <div>
              <p className="label">Enter OTP</p>
              <OTPInput value={otp} onChange={setOtp} />
              <p className="text-xs text-slate-500 mt-1">Demo OTP: {serverOTP}</p>
            </div>
          )}

          <div>
            <p className="label">Aadhaar Last 4 Digits</p>
            <input
              className="input"
              value={aadhaarLast4}
              onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              placeholder="1234"
            />
          </div>

          <div>
            <p className="label">Password</p>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

