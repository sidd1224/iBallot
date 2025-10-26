import React from 'react'
export default function OTPInput({ value = '', onChange = () => {}, length = 6, disabled = false }) {
  const setAt = (i, v) => {
    const clean = v.replace(/\D/g, '')
    const arr = value.split('').slice(0, length)
    while (arr.length < length) arr.push('')
    arr[i] = clean
    onChange(arr.join('').slice(0, length))
  }
  return (
    <div className="flex gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          className="w-10 h-12 text-center text-lg border border-slate-300 rounded-2xl"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => setAt(i, e.target.value)}
        />
      ))}
    </div>
  )
}
