import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import RegisterStep1 from './pages/Register_1'
import DigilockerVerify from './pages/DigilockerVerify'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/register', element: <RegisterStep1 /> },
  { path: '/digilocker/verify', element: <DigilockerVerify /> },
  { path: '/login', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> }
])
export default router
