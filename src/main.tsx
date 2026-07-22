import { createRoot } from 'react-dom/client'
import './utils/clearLegacyLocalStorage'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)
