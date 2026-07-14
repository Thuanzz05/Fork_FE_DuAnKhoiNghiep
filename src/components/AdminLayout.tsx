import { useState, type ReactNode, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import '../pages/admin/AdminDashboardPage.css'

export type AdminIconName =
  | 'menu'
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'customers'
  | 'discount'
  | 'news'
  | 'report'
  | 'settings'
  | 'search'
  | 'bell'
  | 'revenue'
  | 'cart'
  | 'userPlus'
  | 'box'
  | 'arrowUp'
  | 'chevronDown'
  | 'more'
  | 'close'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'filter'
  | 'upload'
  | 'lock'
  | 'unlock'
  | 'pause'
  | 'play'
  | 'calendar'
  | 'eye'

interface AdminIconProps extends SVGProps<SVGSVGElement> {
  name: AdminIconName
}

export const AdminIcon = ({ name, ...props }: AdminIconProps) => {
  const paths: Record<AdminIconName, ReactNode> = {
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    orders: <><path d="M6 2h12l3 5v14H3V7l3-5Z" /><path d="M3 7h18M8 11v1a4 4 0 0 0 8 0v-1" /></>,
    products: <><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 7 9 5 9-5M3 12l9 5 9-5M3 17l9 5 9-5" /></>,
    customers: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    discount: <><path d="M20.6 13.6 11 3H4a1 1 0 0 0-1 1v7l9.6 9.6a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8Z" /><circle cx="7.5" cy="7.5" r="1" /></>,
    news: <><path d="M4 22h16a2 2 0 0 0 2-2V6H8v14a2 2 0 0 1-4 0V4h4" /><path d="M12 10h6M12 14h6M12 18h4" /></>,
    report: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V2" /><path d="M2 19h22" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-1.5-1H2.5v-4h.1A1.7 1.7 0 0 0 4.1 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.5 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 18.9 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1 .99Z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    revenue: <><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 6-7" /></>,
    cart: <><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M2 3h3l2.4 11.3a2 2 0 0 0 2 1.7h8.7a2 2 0 0 0 2-1.6L22 7H6" /></>,
    userPlus: <><path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>,
    box: <><path d="m21 8-9 5-9-5" /><path d="m3 8 9-5 9 5v10l-9 5-9-5V8Z" /><path d="M12 13v10" /></>,
    arrowUp: <path d="m6 15 6-6 6 6" />,
    chevronDown: <path d="m7 10 5 5 5-5" />,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5" /></>,
    filter: <path d="M4 5h16l-6 7v5l-4 2v-7Z" />,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 15v4h14v-4" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    unlock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 7.5-2" /></>,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    play: <path d="m8 5 11 7-11 7Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  )
}

type AdminSection = 'dashboard' | 'orders' | 'products' | 'inventory' | 'accounts' | 'promotions'

interface AdminLayoutProps {
  activeItem: AdminSection
  children: ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
}

const navItems: Array<{ label: string; icon: AdminIconName; section?: AdminSection; to?: string; count?: number }> = [
  { label: 'Tổng quan', icon: 'dashboard', section: 'dashboard', to: '/admin' },
  { label: 'Đơn hàng', icon: 'orders', section: 'orders', to: '/admin/don-hang', count: 12 },
  { label: 'Sản phẩm', icon: 'products', section: 'products', to: '/admin/san-pham' },
  { label: 'Kho hàng', icon: 'box', section: 'inventory', to: '/admin/kho' },
  { label: 'Tài khoản', icon: 'customers', section: 'accounts', to: '/admin/tai-khoan' },
  { label: 'Khuyến mãi', icon: 'discount', section: 'promotions', to: '/admin/khuyen-mai' },
  { label: 'Bài viết', icon: 'news' },
]

function AdminLayout({
  activeItem,
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm đơn hàng, sản phẩm...',
}: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const renderNavItem = (item: (typeof navItems)[number]) => {
    const className = `admin-nav-item${item.section === activeItem ? ' is-active' : ''}`
    const content = (
      <>
        <AdminIcon name={item.icon} />
        <span>{item.label}</span>
        {item.count ? <b>{item.count}</b> : null}
      </>
    )

    return item.to ? (
      <Link key={item.label} to={item.to} className={className} onClick={() => setIsSidebarOpen(false)}>
        {content}
      </Link>
    ) : (
      <button type="button" key={item.label} className={className}>
        {content}
      </button>
    )
  }

  return (
    <div className="admin-dashboard-page">
      <button
        type="button"
        className={`admin-sidebar-backdrop${isSidebarOpen ? ' is-visible' : ''}`}
        aria-label="Đóng menu quản trị"
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={`admin-sidebar${isSidebarOpen ? ' is-open' : ''}`}>
        <div className="admin-brand">
          <img src="/images/logo1.png" alt="Rubeanora" className="admin-brand-logo" />
          <span className="admin-brand-admin">ADMIN CENTER</span>
          <button type="button" className="admin-sidebar-close" onClick={() => setIsSidebarOpen(false)} aria-label="Đóng menu">
            <AdminIcon name="close" />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Điều hướng quản trị">
          <p className="admin-nav-title">QUẢN LÝ</p>
          {navItems.map(renderNavItem)}
          <p className="admin-nav-title admin-nav-title-spaced">HỆ THỐNG</p>
          <button type="button" className="admin-nav-item"><AdminIcon name="report" /><span>Báo cáo</span></button>
          <button type="button" className="admin-nav-item"><AdminIcon name="settings" /><span>Cài đặt</span></button>
        </nav>

        <div className="admin-sidebar-profile">
          <span className="admin-profile-avatar">QT</span>
          <div><strong>Quản trị viên</strong><span>admin@rubeanora.vn</span></div>
          <AdminIcon name="more" />
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-menu-button" onClick={() => setIsSidebarOpen(true)} aria-label="Mở menu quản trị">
            <AdminIcon name="menu" />
          </button>
          <label className="admin-search">
            <AdminIcon name="search" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              aria-label="Tìm kiếm"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
          </label>
          <div className="admin-topbar-actions">
            <button type="button" className="admin-notification" aria-label="Thông báo mới"><AdminIcon name="bell" /><span>3</span></button>
            <button type="button" className="admin-user-menu">
              <span className="admin-profile-avatar">QT</span>
              <span className="admin-user-copy"><strong>Quản trị viên</strong><small>Super Admin</small></span>
              <AdminIcon name="chevronDown" />
            </button>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
