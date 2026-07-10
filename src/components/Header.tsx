import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { categories } from '../data/products'
import { getCartCount, getCartItems } from '../utils/cart'
import { getWishlistIds } from '../utils/wishlist'
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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(() => getWishlistIds().length)
  const [cartCount, setCartCount] = useState(() => getCartCount())

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

  return (
    <header className="site-header">
      <div className="header-top-line" />

      <div className="header-container header-main">
        <Link className="header-logo" to="/" aria-label="Red Bean Beauty">
          <svg className="logo-svg" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="4" fill="#B53740" />
            <ellipse cx="20" cy="10" rx="5" ry="8" fill="#D95A63" opacity="0.85" />
            <ellipse cx="29" cy="15" rx="5" ry="8" fill="#C44850" opacity="0.75" transform="rotate(72 29 15)" />
            <ellipse cx="26" cy="26" rx="5" ry="8" fill="#D95A63" opacity="0.7" transform="rotate(144 26 26)" />
            <ellipse cx="14" cy="26" rx="5" ry="8" fill="#C44850" opacity="0.75" transform="rotate(216 14 26)" />
            <ellipse cx="11" cy="15" rx="5" ry="8" fill="#D95A63" opacity="0.8" transform="rotate(288 11 15)" />
            <circle cx="20" cy="20" r="2.5" fill="#F0A0A5" opacity="0.6" />
            <path d="M28 32 C30 28, 34 30, 32 34 C30 36, 28 34, 28 32Z" fill="#7DAF8E" opacity="0.7" />
          </svg>
          <span className="logo-text">RED BEAN BEAUTY</span>
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
              0986126955
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
              Hoangthingocmai2005@gmail.com
            </span>
          </div>
        </div>

        <div className="header-actions">
          <Link className="account-button" to="/tai-khoan">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Tài khoản
          </Link>

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

      <nav className="header-nav" aria-label="Điều hướng chính">
        <div className="header-container nav-container">
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.label}
                className={item.hasDropdown ? 'has-dropdown' : undefined}
                onMouseEnter={() => item.hasDropdown && setDropdownOpen(true)}
                onMouseLeave={() => item.hasDropdown && setDropdownOpen(false)}
                onFocus={() => item.hasDropdown && setDropdownOpen(true)}
                onBlur={(event) => {
                  if (item.hasDropdown && !event.currentTarget.contains(event.relatedTarget)) {
                    setDropdownOpen(false)
                  }
                }}
              >
                <Link className={isActive(item.path) ? 'active' : undefined} to={item.path}>
                  {item.label}
                  {item.hasDropdown && <span className="nav-arrow" aria-hidden="true" />}
                </Link>

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
                            onClick={() => setDropdownOpen(false)}
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

          <Link className="flash-sale" to="/flash-sale">
            <span aria-hidden="true">⚡</span>
            Flash Sale
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default Header
