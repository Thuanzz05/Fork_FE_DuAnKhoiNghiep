import { NavLink, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../utils/auth'
import { getUserDisplayName, getUserInitial, logoutDemo } from '../utils/auth'

function CustomerAccountSidebar({ user }: { user: AuthUser }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutDemo()
    navigate('/tai-khoan?che-do=dang-nhap')
  }

  return (
    <aside className="customer-sidebar">
      <div className="customer-sidebar-profile">
        <div className="customer-sidebar-avatar">
          {user.avatar ? <img src={user.avatar} alt="Ảnh đại diện" /> : <span>{getUserInitial(user)}</span>}
        </div>
        <strong>{getUserDisplayName(user)}</strong>
        <small>{user.email}</small>
      </div>

      <nav aria-label="Tài khoản khách hàng">
        <NavLink to="/tai-khoan/thong-tin">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8" /></svg>
          Thông tin tài khoản
        </NavLink>
        <NavLink to="/tai-khoan/don-hang">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M9 11h6M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          Đơn hàng của tôi
        </NavLink>
        <NavLink to="/tai-khoan/doi-mat-khau">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          Đổi mật khẩu
        </NavLink>
        <button type="button" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>
          Đăng xuất
        </button>
      </nav>
    </aside>
  )
}

export default CustomerAccountSidebar
