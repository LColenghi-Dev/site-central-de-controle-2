import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Aplica tema salvo antes de renderizar (sem flash)
const tema = localStorage.getItem('cfg_tema') ?? 'dark'
document.documentElement.setAttribute('data-theme', tema)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
