import React from 'react'

export default function FileDropzone({ onFileSelected, accept = '.xml' }) {
  function handleChange(e) {
    const file = e.target.files[0]
    if (file && !file.name.endsWith('.xml')) {
      alert('Only XML Aadhaar files are allowed')
      e.target.value = ''
      return
    }
    onFileSelected(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100"
      />
    </div>
  )
}
