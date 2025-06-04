import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/tailwind.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { MobileNavigationProvider } from './contexts/MobileNavigationContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MobileNavigationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MobileNavigationProvider>
    </BrowserRouter>
  </React.StrictMode>,
) 