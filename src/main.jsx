import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'

// REPLACE WITH YOUR ACTUAL GOOGLE CLIENT ID
const GOOGLE_CLIENT_ID = "1044050177778-71b3g1iasquu37vrorgqrhsvuoqbd7th.apps.googleusercontent.com"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
