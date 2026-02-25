import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: "'DM Sans', sans-serif", fontSize: '14px' },
            success: { iconTheme: { primary: '#0F2044', secondary: '#FAF8F3' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)