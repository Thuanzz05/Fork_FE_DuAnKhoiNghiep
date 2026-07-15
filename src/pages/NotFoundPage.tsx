import { Link, useLocation } from 'react-router-dom'
import './NotFoundPage.css'

function NotFoundPage() {
  const location = useLocation()

  return (
    <main className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-code" aria-hidden="true">
          <span>4</span>
          <i>
            <svg viewBox="0 0 120 120">
              <path d="M60 103c-23-14-38-30-38-53 0-18 12-31 29-31 10 0 17 5 21 12 5-7 12-12 22-12 17 0 29 13 29 31 0 23-16 39-39 53L72 110 60 103Z" />
              <path d="M49 47c8 5 15 14 18 25M88 42c-8 8-13 18-16 30" />
            </svg>
          </i>
          <span>4</span>
        </div>

        <p className="not-found-eyebrow">Trang không tồn tại</p>
        <h1>Không tìm thấy nội dung bạn cần</h1>
        <p className="not-found-description">
          Đường dẫn <code>{location.pathname}</code> có thể đã thay đổi hoặc không còn tồn tại.
        </p>

        <div className="not-found-actions">
          <Link className="not-found-home" to="/">Quay về trang chủ</Link>
          <Link className="not-found-products" to="/san-pham">Xem sản phẩm</Link>
        </div>
      </div>
    </main>
  )
}

export default NotFoundPage
