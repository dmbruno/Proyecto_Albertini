import { StrictMode }  from 'react'
import { createRoot }  from 'react-dom/client'
import { AuthProvider }  from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import './styles/globals.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
