import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeAnalytics } from './utils/analytics.js'
import "@fontsource/inter";
import "@fontsource-variable/geist";
import "@fontsource/jetbrains-mono";

initializeAnalytics();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
