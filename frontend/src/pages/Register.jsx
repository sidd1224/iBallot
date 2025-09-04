import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'
import OTPInput from '../components/OTPInput'
import { sendOTP, verifyOTP } from '../services/otpService'
import { registerUser } from '../services/authService'

export default function Register() {
  const nav = useNavigate()
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [showTick, setShowTick] = useState(false)
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverOTP, setServerOTP] = useState('')

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file && file.name.endsWith('.xml')) {
      setAadhaarFile(file)
      setShowTick(false)
    } else {
      alert('Only .xml Aadhaar files are allowed')
      e.target.value = null
    }
  }

  function handleUpload() {
    if (!aadhaarFile) {
      alert('Please choose a file first')
      return
    }
    setUploadedFile(aadhaarFile)
    setShowTick(true)
  }

  async function handleSendOTP() {
    if (!uploadedFile) {
      alert('Upload Aadhaar XML first')
      return
    }
    setLoading(true)
    const res = await sendOTP('aadhaar-linked-number')
    setLoading(false)
    if (res?.success) {
      setOtpSent(true)
      setServerOTP(res.otp)
    } else {
      alert('Failed to send OTP')
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!uploadedFile) {
      alert('Upload Aadhaar XML file')
      return
    }
    if (otp.length !== 6) {
      alert('Enter valid 6-digit OTP')
      return
    }
    if (!password) {
      alert('Enter password')
      return
    }

    setLoading(true)
    const ok = await verifyOTP('aadhaar-linked-number', otp)
    setLoading(false)
    if (!ok) {
      alert('Invalid OTP')
      return
    }

    try {
      registerUser({
        aadhaarFile: uploadedFile.name,
        password,
      })
      alert('Registration successful! Please login.')
      nav('/login')
    } catch (err) {
      alert(err.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-brand-50">
      <div className="w-full max-w-xl card">
        <div className="flex items-center justify-between">
          <BrandLogo />
        </div>

        <h2 className="mt-6 text-2xl font-extrabold">Register</h2>

        <form className="mt-6 space-y-5" onSubmit={handleRegister}>
          <div>
            <p className="label">Choose Aadhaar XML</p>
            <input
              type="file"
              accept=".xml"
              onChange={handleFileChange}
              className="input"
            />
            <button
              type="button"
              className="btn btn-secondary mt-2"
              onClick={handleUpload}
            >
              Upload
            </button>

            {uploadedFile && showTick && (
              <div className="flex items-center gap-2 mt-2 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 animate-bounce"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">File uploaded successfully</span>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleSendOTP}
              disabled={loading}
            >
              {loading ? 'Sending OTP…' : 'Get OTP'}
            </button>
          </div>

          {otpSent && (
            <div>
              <p className="label">Enter OTP</p>
              <OTPInput value={otp} onChange={setOtp} />
              <p className="text-xs text-slate-500 mt-1">Demo OTP: {serverOTP}</p>
            </div>
          )}

          <div>
            <p className="label">Password</p>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set password"
            />
          </div>

          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already registered?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Login here
          </Link>
        </p>

        {/* ✅ Back to Home */}
        <div className="mt-2 text-center">
          <Link
            to="/"
            className="text-slate-600 text-sm font-medium hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}



