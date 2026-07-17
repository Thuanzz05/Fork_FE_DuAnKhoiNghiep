import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import CustomerAccountSidebar from '../components/CustomerAccountSidebar'
import { changeDemoPassword, getCurrentUser } from '../utils/auth'
import './CustomerAccountPage.css'

function ChangePasswordPage() {
  const user = getCurrentUser()
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [isError, setIsError] = useState(false)

  if (!user) return <Navigate to="/tai-khoan?che-do=dang-nhap" replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const currentPassword = String(formData.get('currentPassword') || '')
    const newPassword = String(formData.get('newPassword') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')

    if (newPassword !== confirmPassword) {
      setIsError(true)
      setNotice('Mật khẩu mới và mật khẩu xác nhận chưa trùng khớp.')
      return
    }

    try {
      await changeDemoPassword(currentPassword, newPassword)
    } catch (error) {
      setIsError(true)
      setNotice(error instanceof Error ? error.message : 'Không thể đổi mật khẩu.')
      return
    }

    setIsError(false)
    setNotice('Mật khẩu đã được thay đổi thành công.')
    event.currentTarget.reset()
  }

  return (
    <main className="customer-account-page">
      <div className="customer-account-container customer-account-layout">
        <CustomerAccountSidebar user={user} />
        <div className="customer-account-main">
          <section className="customer-panel change-password-panel">
            <div className="customer-panel-heading">
              <div><p>Bảo mật tài khoản</p><h1>Đổi mật khẩu</h1></div>
            </div>
            <p className="change-password-description">Mật khẩu nên có ít nhất 6 ký tự và không nên trùng với mật khẩu bạn sử dụng ở nơi khác.</p>
            <form className="change-password-form" onSubmit={handleSubmit}>
              <label><span>Mật khẩu hiện tại *</span><input type={showPassword ? 'text' : 'password'} name="currentPassword" required /></label>
              <label><span>Mật khẩu mới *</span><input type={showPassword ? 'text' : 'password'} name="newPassword" minLength={6} required /></label>
              <label><span>Xác nhận mật khẩu mới *</span><input type={showPassword ? 'text' : 'password'} name="confirmPassword" minLength={6} required /></label>
              <label className="show-password-checkbox"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /><span>Hiện mật khẩu</span></label>
              <button className="customer-primary-button" type="submit">Cập nhật mật khẩu</button>
            </form>
            {notice && <p className={`customer-success${isError ? ' error' : ''}`} role="status">{notice}</p>}
          </section>
        </div>
      </div>
    </main>
  )
}

export default ChangePasswordPage
