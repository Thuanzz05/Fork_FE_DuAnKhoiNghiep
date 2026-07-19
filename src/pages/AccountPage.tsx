import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import GoogleSignInButton from '../components/GoogleSignInButton'
import {
  getCurrentUser,
  loginDemo,
  loginWithGoogle,
  registerDemo,
  requestPasswordReset,
  resetForgottenPassword,
} from '../utils/auth'
import './AccountPage.css'

type AccountMode = 'login' | 'register' | 'forgot' | 'reset'
type NoticeKind = 'info' | 'success' | 'error'

const resolveMode = (value: string | null, token: string): AccountMode => {
  if (value === 'dang-ky') return 'register'
  if (value === 'quen-mat-khau') return 'forgot'
  if (value === 'dat-lai-mat-khau' && token) return 'reset'
  return 'login'
}

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
  const resetToken = searchParams.get('token')?.trim() ?? ''
  const requestedMode = resolveMode(searchParams.get('che-do'), resetToken)
  const [mode, setMode] = useState<AccountMode>(requestedMode)
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeKind, setNoticeKind] = useState<NoticeKind>('info')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const existingUser = getCurrentUser()

  const changeMode = (nextMode: AccountMode) => {
    setMode(nextMode)
    const modeValue = {
      login: 'dang-nhap',
      register: 'dang-ky',
      forgot: 'quen-mat-khau',
      reset: 'dat-lai-mat-khau',
    }[nextMode]
    setSearchParams(nextMode === 'reset' && resetToken
      ? { 'che-do': modeValue, token: resetToken }
      : { 'che-do': modeValue })
    setShowPassword(false)
    setNotice('')
    setNoticeKind('info')
    setResetComplete(false)
  }

  useEffect(() => {
    setMode(requestedMode)
    setShowPassword(false)
    setNotice('')
    setNoticeKind('info')
    setResetComplete(false)
  }, [requestedMode])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    try {
      setIsSubmitting(true)
      setNoticeKind('info')

      if (mode === 'forgot') {
        setNotice('Đang gửi liên kết đặt lại mật khẩu...')
        const result = await requestPasswordReset(email)
        setNotice(result.message)
        setNoticeKind('success')
        return
      }

      if (mode === 'reset') {
        const newPassword = String(formData.get('newPassword') || '')
        if (newPassword !== formData.get('confirmPassword')) {
          setNotice('Mật khẩu xác nhận chưa trùng khớp.')
          setNoticeKind('error')
          return
        }
        if (!resetToken) {
          setNotice('Liên kết đặt lại mật khẩu không hợp lệ.')
          setNoticeKind('error')
          return
        }

        setNotice('Đang cập nhật mật khẩu mới...')
        const result = await resetForgottenPassword(resetToken, newPassword)
        setNotice(result.message || 'Đặt lại mật khẩu thành công.')
        setNoticeKind('success')
        setResetComplete(true)
        return
      }

      setNotice('Đang kết nối máy chủ...')
      if (mode === 'register') {
        if (formData.get('password') !== formData.get('confirmPassword')) {
          setNotice('Mật khẩu xác nhận chưa trùng khớp.')
          setNoticeKind('error')
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
      setNotice(error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.')
      setNoticeKind('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = useCallback(async (credential: string) => {
    try {
      setNoticeKind('info')
      setNotice('Đang xác thực tài khoản Google...')
      const user = await loginWithGoogle(credential)
      navigate(user.role === 'ADMIN' ? '/admin' : '/')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể đăng nhập bằng Google.')
      setNoticeKind('error')
    }
  }, [navigate])

  if (existingUser && mode !== 'forgot' && mode !== 'reset') {
    return <Navigate to={existingUser.role === 'ADMIN' ? '/admin' : '/'} replace />
  }

  const title = {
    login: 'Đăng nhập tài khoản',
    register: 'Tạo tài khoản mới',
    forgot: 'Quên mật khẩu',
    reset: 'Đặt lại mật khẩu',
  }[mode]

  const submitLabel = {
    login: 'Đăng nhập',
    register: 'Tạo tài khoản',
    forgot: 'Gửi liên kết qua Gmail',
    reset: 'Lưu mật khẩu mới',
  }[mode]

  const showStandardTabs = mode === 'login' || mode === 'register'
  const showSocialLogin = mode === 'login' || mode === 'register'

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="account-title">
        {showStandardTabs && (
          <div className="account-tabs" role="tablist" aria-label="Tài khoản">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>
              Đăng nhập
            </button>
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => changeMode('register')}>
              Đăng ký
            </button>
          </div>
        )}

        <div className="account-form-wrap">
          <div className="account-heading">
            <p>Red Bean Beauty</p>
            <h1 id="account-title">{title}</h1>
            {mode === 'forgot' && <span>Nhập email đã đăng ký. Hệ thống sẽ gửi một liên kết có hiệu lực trong 15 phút.</span>}
            {mode === 'reset' && <span>Tạo mật khẩu mới có ít nhất 6 ký tự cho tài khoản của bạn.</span>}
          </div>

          {!resetComplete && (
            <form className="account-form" onSubmit={handleSubmit} key={mode}>
              {mode === 'register' && (
                <div className="account-name-row">
                  <label><span>Họ *</span><input type="text" name="lastName" placeholder="Nhập họ" autoComplete="family-name" required /></label>
                  <label><span>Tên *</span><input type="text" name="firstName" placeholder="Nhập tên" autoComplete="given-name" required /></label>
                </div>
              )}

              {mode === 'register' && (
                <label>
                  <span>Số điện thoại *</span>
                  <input type="tel" name="phone" placeholder="Nhập số điện thoại" autoComplete="tel" pattern="[0-9]{9,11}" title="Số điện thoại gồm 9 đến 11 chữ số" required />
                </label>
              )}

              {mode !== 'reset' && (
                <label><span>Email *</span><input type="email" name="email" placeholder="Nhập địa chỉ email" autoComplete="email" required /></label>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                <label>
                  <span>{mode === 'reset' ? 'Mật khẩu mới *' : 'Mật khẩu *'}</span>
                  <div className="password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name={mode === 'reset' ? 'newPassword' : 'password'}
                      placeholder={mode === 'reset' ? 'Nhập mật khẩu mới' : 'Nhập mật khẩu'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      minLength={6}
                      required
                    />
                    <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword((visible) => !visible)}>
                      <EyeIcon hidden={!showPassword} />
                    </button>
                  </div>
                </label>
              )}

              {(mode === 'register' || mode === 'reset') && (
                <label>
                  <span>Xác nhận mật khẩu *</span>
                  <div className="password-field">
                    <input type={showPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Nhập lại mật khẩu" autoComplete="new-password" minLength={6} required />
                    <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'} onClick={() => setShowPassword((visible) => !visible)}>
                      <EyeIcon hidden={!showPassword} />
                    </button>
                  </div>
                </label>
              )}

              {mode === 'login' && (
                <div className="account-options">
                  <label className="remember-option"><input type="checkbox" name="remember" /><span>Ghi nhớ đăng nhập</span></label>
                  <button type="button" className="forgot-button" onClick={() => changeMode('forgot')}>Quên mật khẩu?</button>
                </div>
              )}

              <button className="account-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : submitLabel}
              </button>
            </form>
          )}

          {notice && <p className={`account-notice ${noticeKind}`} role="status">{notice}</p>}

          {resetComplete && (
            <button type="button" className="account-submit reset-login-button" onClick={() => changeMode('login')}>
              Đăng nhập bằng mật khẩu mới
            </button>
          )}

          {showSocialLogin && (
            <>
              <div className="account-divider"><span>hoặc tiếp tục với</span></div>
              <div className="social-login">
                <GoogleSignInButton onCredential={handleGoogleLogin} onError={(message) => { setNotice(message); setNoticeKind('error') }} />
              </div>
            </>
          )}

          <p className="account-switch">
            {mode === 'login' && <>Bạn chưa có tài khoản? <button type="button" onClick={() => changeMode('register')}>Đăng ký ngay</button></>}
            {mode === 'register' && <>Bạn đã có tài khoản? <button type="button" onClick={() => changeMode('login')}>Đăng nhập</button></>}
            {(mode === 'forgot' || mode === 'reset') && <>Đã nhớ mật khẩu? <button type="button" onClick={() => changeMode('login')}>Quay lại đăng nhập</button></>}
          </p>
        </div>
      </section>
    </main>
  )
}

export default AccountPage
