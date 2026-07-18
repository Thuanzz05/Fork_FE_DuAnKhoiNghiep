import { useEffect, useRef, useState } from 'react'

const GOOGLE_SCRIPT_ID = 'google-identity-services'
const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void
  onError: (message: string) => void
}

function GoogleSignInButton({ onCredential, onError }: GoogleSignInButtonProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [configurationError, setConfigurationError] = useState('')

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
    if (!clientId) {
      setConfigurationError('Chưa cấu hình VITE_GOOGLE_CLIENT_ID.')
      return
    }

    let cancelled = false

    const renderGoogleButton = () => {
      if (cancelled || !hostRef.current || !window.google) return

      hostRef.current.replaceChildren()
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) onCredential(response.credential)
          else onError('Google không trả về thông tin đăng nhập.')
        },
        cancel_on_tap_outside: true,
      })
      window.google.accounts.id.renderButton(hostRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: Math.min(hostRef.current.clientWidth || 320, 400),
        locale: 'vi',
      })
    }

    if (window.google) {
      renderGoogleButton()
      return () => {
        cancelled = true
      }
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null
    const script = existingScript ?? document.createElement('script')

    const handleLoad = () => renderGoogleButton()
    const handleError = () => onError('Không tải được dịch vụ đăng nhập Google.')
    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)

    if (!existingScript) {
      script.id = GOOGLE_SCRIPT_ID
      script.src = GOOGLE_SCRIPT_URL
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
    }
  }, [onCredential, onError])

  if (configurationError) {
    return <p className="google-signin-error">{configurationError}</p>
  }

  return <div ref={hostRef} className="google-signin-host" aria-label="Đăng nhập bằng Google" />
}

export default GoogleSignInButton
