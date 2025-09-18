import './utils/polyfills' // Must be first to set up global Buffer
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './utils/testBip39' // Initialize BIP39 testing utility

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
