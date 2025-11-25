import React from 'react'
export default function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-brand-500 grid place-items-center text-white font-bold">IB</div>
      <span className="text-xl font-extrabold text-slate-900">iBallot</span>
    </div>
  )
}
