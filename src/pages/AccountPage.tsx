import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { getCurrentUser, loginDemo, loginSocial, registerDemo } from '../utils/auth'
import './AccountPage.css'

type AccountMode = 'login' | 'register'

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  )
}

function AccountPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedMode = searchParams.get('che-do') === 'dang-ky' ? 'register' : 'login'
  const [mode, setMode] = useState<AccountMode>(requestedMode)
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const existingUser = getCurrentUser()

  const changeMode = (nextMode: AccountMode) => {
    setMode(nextMode)
    setSearchParams({ 'che-do': nextMode === 'register' ? 'dang-ky' : 'dang-nhap' })
    setShowPassword(false)
    setNotice('')
  }

  useEffect(() => {
    setMode(requestedMode)
    setShowPassword(false)
    setNotice('')
  }, [requestedMode])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')

    try {
      setNotice('Đang kết nối máy chủ...')
      if (mode === 'register') {
        if (formData.get('password') !== formData.get('confirmPassword')) {
          setNotice('Mật khẩu xác nhận chưa trùng khớp.')
          return
        }

        const user = await registerDemo(
          {
            email,
            firstName: String(formData.get('firstName') || '').trim(),
            lastName: String(formData.get('lastName') || '').trim(),
            phone: String(formData.get('phone') || '').trim(),
          },
          password,
        )
        navigate(user.role === 'ADMIN' ? '/admin' : '/')
      } else {
        const user = await loginDemo(email, password)
        navigate(user.role === 'ADMIN' ? '/admin' : '/')
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể đăng nhập. Vui lòng thử lại.')
    }
  }

  const handleSocialLogin = async (provider: 'Google' | 'Facebook') => {
    try {
      setNotice('Đang kết nối máy chủ...')
      const user = await loginSocial(provider.toLowerCase() as 'google' | 'facebook')
      navigate(user.role === 'ADMIN' ? '/admin' : '/')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể đăng nhập mạng xã hội.')
    }
  }

  if (existingUser) {
    return <Navigate to={existingUser.role === 'ADMIN' ? '/admin' : '/'} replace />
  }

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="account-title">
        <div className="account-tabs" role="tablist" aria-label="Tài khoản">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => changeMode('login')}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => changeMode('register')}
          >
            Đăng ký
          </button>
        </div>

        <div className="account-form-wrap">
          <div className="account-heading">
            <p>Red Bean Beauty</p>
            <h1 id="account-title">{mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}</h1>
          </div>

          <form className="account-form" onSubmit={handleSubmit} key={mode}>
            {mode === 'register' && (
              <div className="account-name-row">
                <label>
                  <span>Họ *</span>
                  <input type="text" name="lastName" placeholder="Nhập họ" autoComplete="family-name" required />
                </label>
                <label>
                  <span>Tên *</span>
                  <input type="text" name="firstName" placeholder="Nhập tên" autoComplete="given-name" required />
                </label>
              </div>
            )}

            {mode === 'register' && (
              <label>
                <span>Số điện thoại *</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  autoComplete="tel"
                  pattern="[0-9]{9,11}"
                  title="Số điện thoại gồm 9 đến 11 chữ số"
                  required
                />
              </label>
            )}

            <label>
              <span>Email *</span>
              <input type="email" name="email" placeholder="Nhập địa chỉ email" autoComplete="email" required />
            </label>

            <label>
              <span>Mật khẩu *</span>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Nhập mật khẩu"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  <EyeIcon hidden={!showPassword} />
                </button>
              </div>
            </label>

            {mode === 'register' && (
              <label>
                <span>Xác nhận mật khẩu *</span>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    <EyeIcon hidden={!showPassword} />
                  </button>
                </div>
              </label>
            )}

            {mode === 'login' && (
              <div className="account-options">
                <label className="remember-option">
                  <input type="checkbox" name="remember" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button type="button" className="forgot-button" onClick={() => setNotice('Vui lòng kiểm tra email để đặt lại mật khẩu.')}>Quên mật khẩu?</button>
              </div>
            )}

            <button className="account-submit" type="submit">
              {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          {notice && <p className={`account-notice${notice.includes('chưa trùng') ? ' error' : ''}`} role="status">{notice}</p>}

          <div className="account-divider"><span>hoặc tiếp tục với</span></div>

          <div className="social-login">
            <button type="button" onClick={() => handleSocialLogin('Google')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.2c0-.7-.1-1.4-.2-2H12v3.7h5.1a4.4 4.4 0 0 1-1.9 2.8v2.4h3.1c1.8-1.7 2.7-4.1 2.7-6.9Z" /><path d="M12 21c2.5 0 4.7-.8 6.3-2.2l-3.1-2.4c-.9.6-2 .9-3.2.9a5.5 5.5 0 0 1-5.2-3.8H3.6V16A9.5 9.5 0 0 0 12 21Z" /><path d="M6.8 13.5a5.7 5.7 0 0 1 0-3.5V7.5H3.6a9.5 9.5 0 0 0 0 8.5l3.2-2.5Z" /><path d="M12 6.3c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.3 9.3 0 0 0 3.6 7.5L6.8 10A5.5 5.5 0 0 1 12 6.3Z" /></svg>
              Google
            </button>
            <button type="button" onClick={() => handleSocialLogin('Facebook')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1Z" /></svg>
              Facebook
            </button>
          </div>

          <p className="account-switch">
            {mode === 'login' ? 'Bạn chưa có tài khoản?' : 'Bạn đã có tài khoản?'}{' '}
            <button type="button" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default AccountPage
