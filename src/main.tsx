import { createRoot } from 'react-dom/client'
import './utils/clearLegacyLocalStorage'
import './index.css'
import App from './App.tsx'
import { registerPushWorker } from './services/notifications.ts'

window.addEventListener('load', () => {
  void registerPushWorker().catch((error) => {
    console.warn('Không thể đăng ký service worker nhận thông báo:', error)
  })
}, { once: true })

createRoot(document.getElementById('root')!).render(<App />)
