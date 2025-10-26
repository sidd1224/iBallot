import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'; // <-- CSS IMPORT MOVED HERE
import { VerificationProvider } from './context/VerificationContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VerificationProvider>
      <App />
    </VerificationProvider>
  </React.StrictMode>,
)

