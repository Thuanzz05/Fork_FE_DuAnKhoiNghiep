import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { categories } from '../data/products'
import { getCartCount, getCartItems } from '../utils/cart'
import { getWishlistIds } from '../utils/wishlist'
import { getCurrentUser, getUserDisplayName, getUserInitial, logoutDemo } from '../utils/auth'
import { useStoreSettings } from '../utils/storeSettings'
import './Header.css'

const menuItems = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Giới thiệu', path: '/gioi-thieu' },
  { label: 'Sản phẩm', path: '/san-pham', hasDropdown: true },
  { label: 'Tin tức', path: '/tin-tuc' },
  { label: 'Liên hệ', path: '/lien-he' },
]

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const storeSettings = useStoreSettings()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(() => getWishlistIds().length)
  const [cartCount, setCartCount] = useState(() => getCartCount())
  const [authUser, setAuthUser] = useState(() => getCurrentUser())

  useEffect(() => {
    const syncAuth = () => setAuthUser(getCurrentUser())
    window.addEventListener('storage', syncAuth)
    window.addEventListener('auth-updated', syncAuth)
    return () => {
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('auth-updated', syncAuth)
    }
  }, [])

  useEffect(() => {
    const syncWishlistCount = () => setWishlistCount(getWishlistIds().length)
    const handleWishlistUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string[]>
      setWishlistCount((customEvent.detail || getWishlistIds()).length)
    }

    window.addEventListener('storage', syncWishlistCount)
    window.addEventListener('wishlist-updated', handleWishlistUpdated)

    return () => {
      window.removeEventListener('storage', syncWishlistCount)
      window.removeEventListener('wishlist-updated', handleWishlistUpdated)
    }
  }, [])

  useEffect(() => {
    const syncCartCount = () => setCartCount(getCartCount())
    const handleCartUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ReturnType<typeof getCartItems>>
      setCartCount((customEvent.detail || getCartItems()).reduce((total, item) => total + item.quantity, 0))
    }

    window.addEventListener('storage', syncCartCount)
    window.addEventListener('cart-updated', handleCartUpdated)

    return () => {
      window.removeEventListener('storage', syncCartCount)
      window.removeEventListener('cart-updated', handleCartUpdated)
    }
  }, [])

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logoutDemo()
    setAccountMenuOpen(false)
    if (location.pathname.startsWith('/tai-khoan')) navigate('/tai-khoan?che-do=dang-nhap')
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setAccountMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="site-header">
      <div className="header-top-line" />

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" role="presentation" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="header-container header-main">
        {/* Hamburger button — mobile only */}
        <button
          className="hamburger-btn"
          type="button"
          aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className={`hamburger-icon${mobileMenuOpen ? ' open' : ''}`}>
            <span /><span /><span />
          </span>
        </button>

        <Link className="header-logo" to="/" aria-label={storeSettings.storeName}>
          <img src={storeSettings.logo || '/images/logo1.png'} alt={storeSettings.storeName} className="logo-img" />
        </Link>

        <form className="header-search" role="search">
          <input type="search" placeholder="Tìm kiếm sản phẩm" aria-label="Tìm kiếm sản phẩm" />
          <button type="submit" aria-label="Tìm kiếm">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16.5 16.5 4 4" />
            </svg>
          </button>
        </form>

        <div className="header-info" aria-label="Thông tin liên hệ">
          <div className="info-item">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 16.92v2.4a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.6 2 2 0 0 1 4.1 1.42h2.4a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.61a2 2 0 0 1-.45 2.11L7.63 8.88a16 16 0 0 0 7.49 7.49l1.02-1.02a2 2 0 0 1 2.11-.45c.84.28 1.71.48 2.61.6A2 2 0 0 1 22 16.92Z" />
            </svg>
            <span>
              <b>Hotline:</b>
              <br />
              {storeSettings.hotline}
            </span>
          </div>

          <div className="info-item">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 5h18v14H3z" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <span>
              <b>Email:</b>
              <br />
              {storeSettings.contactEmail}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <div
            className={`account-menu${accountMenuOpen ? ' open' : ''}`}
            onMouseEnter={() => setAccountMenuOpen(true)}
            onMouseLeave={() => setAccountMenuOpen(false)}
          >
            <button
              className="account-button"
              type="button"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              {authUser ? (
                <span className="header-user-avatar">
                  {authUser.avatar ? <img src={authUser.avatar} alt="" /> : getUserInitial(authUser)}
                </span>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
              <span className="account-button-label">{authUser ? getUserDisplayName(authUser) : 'Tài khoản'}</span>
              <span className="account-chevron" aria-hidden="true" />
            </button>

            <div className="account-dropdown" role="menu">
              {authUser ? (
                <>
                  <div className="account-dropdown-user">
                    <strong>{getUserDisplayName(authUser)}</strong>
                    <small>{authUser.email}</small>
                  </div>
                  <Link role="menuitem" to="/tai-khoan/thong-tin" onClick={(event) => { event.currentTarget.blur(); setAccountMenuOpen(false) }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8" /></svg>
                    Thông tin tài khoản
                  </Link>
                  <Link role="menuitem" to="/tai-khoan/don-hang" onClick={(event) => { event.currentTarget.blur(); setAccountMenuOpen(false) }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                      <path d="M9 11h6M9 15h4" />
                    </svg>
                    Đơn hàng của tôi
                  </Link>
                  <Link role="menuitem" to="/tai-khoan/doi-mat-khau" onClick={(event) => { event.currentTarget.blur(); setAccountMenuOpen(false) }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                    Đổi mật khẩu
                  </Link>
                  <button role="menuitem" type="button" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link role="menuitem" to="/tai-khoan?che-do=dang-nhap" onClick={(event) => { event.currentTarget.blur(); setAccountMenuOpen(false) }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>
                    Đăng nhập
                  </Link>
                  <Link role="menuitem" to="/tai-khoan?che-do=dang-ky" onClick={(event) => { event.currentTarget.blur(); setAccountMenuOpen(false) }}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 21a7 7 0 0 0-14 0M8 11a4 4 0 1 0 0-8M19 8v6M16 11h6" /></svg>
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>

          <Link className="icon-button wishlist-button" to="/yeu-thich" aria-label="Sản phẩm yêu thích">
            <span className="count-badge">{wishlistCount}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </Link>

          <Link className="cart-button" to="/gio-hang">
            <span className="count-badge">{cartCount}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="20" r="1.7" />
              <circle cx="18" cy="20" r="1.7" />
              <path d="M3 4h2l2.4 10.8a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6" />
            </svg>
            <span>Cart</span>
          </Link>
        </div>
      </div>

      <nav className={`header-nav${mobileMenuOpen ? ' mobile-open' : ''}`} aria-label="Điều hướng chính">
        {/* Mobile nav header: Menu + close */}
        <div className="mobile-nav-header">
          <span className="mobile-nav-title">Menu</span>
          <button
            type="button"
            className="mobile-nav-close"
            aria-label="Đóng menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="header-container nav-container">
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.label}
                className={item.hasDropdown ? 'has-dropdown' : undefined}
                onMouseEnter={() => item.hasDropdown && setDropdownOpen(true)}
                onMouseLeave={() => item.hasDropdown && setDropdownOpen(false)}
              >
                {item.hasDropdown ? (
                  <button
                    type="button"
                    className={`nav-link-btn${isActive(item.path) ? ' active' : ''}`}
                    onClick={() => setDropdownOpen((prev) => !prev)}
                  >
                    {item.label}
                    {/* Desktop: arrow, Mobile: +/- */}
                    <span className="nav-arrow" aria-hidden="true" />
                    <span className="nav-plus-minus" aria-hidden="true">{dropdownOpen ? '−' : '+'}</span>
                  </button>
                ) : (
                  <Link
                    className={isActive(item.path) ? 'active' : undefined}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}

                {item.hasDropdown && (
                  <div className={`nav-dropdown${dropdownOpen ? ' open' : ''}`}>
                    <div className="dropdown-panel">
                      <div className="dropdown-categories">
                        <p className="dropdown-kicker">Danh mục sản phẩm</p>
                        {categories.map((cat) => (
                          <Link
                            key={cat.slug}
                            to={cat.slug === 'tat-ca' ? '/san-pham' : `/san-pham?danh-muc=${cat.slug}`}
                            className="dropdown-item"
                            onClick={() => { setDropdownOpen(false); setMobileMenuOpen(false) }}
                          >
                            <span>{cat.name}</span>
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

        </div>
      </nav>
    </header>
  )
}

export default Header
