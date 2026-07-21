import './Footer.css'
import { useStoreSettings } from '../utils/storeSettings'

function Footer() {
  const storeSettings = useStoreSettings()

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-container footer-grid">
          <div className="footer-col footer-about">
            <h3>Giới Thiệu</h3>
            <p>
              {storeSettings.storeDescription}
            </p>
          </div>

          <div className="footer-col">
            <h3>Về Chúng Tôi</h3>
            <ul>
              <li>
                <a href="/">Trang chủ</a>
              </li>
              <li>
                <a href="/gioi-thieu">Giới thiệu</a>
              </li>
              <li>
                <a href="/san-pham">Sản phẩm</a>
              </li>
              <li>
                <a href="/tin-tuc">Tin tức</a>
              </li>
              <li>
                <a href="/lien-he">Liên hệ</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Hỗ Trợ Khách Hàng</h3>
            <ul>
              <li>
                <a href="/don-hang">Đơn hàng</a>
              </li>
              <li>
                <a href="/chinh-sach-giao-hang">Chính sách giao hàng</a>
              </li>
              <li>
                <a href="/chinh-sach-doi-tra">Chính sách đổi trả</a>
              </li>
              <li>
                <a href="/chinh-sach-ban-hang">Chính sách bán hàng</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Theo Dõi Chúng Tôi</h3>
            <div className="footer-social">
              {storeSettings.youtubeEnabled && (
                <a href={storeSettings.youtubeUrl || '#'} aria-label="YouTube" className="social-icon" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.35 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#B53740" />
                  </svg>
                </a>
              )}
              {storeSettings.facebookEnabled && (
                <a href={storeSettings.facebookUrl || '#'} aria-label="Facebook" className="social-icon" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
              {storeSettings.instagramEnabled && (
                <a href={storeSettings.instagramUrl || '#'} aria-label="Instagram" className="social-icon" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
              {storeSettings.tiktokEnabled && (
                <a href={storeSettings.tiktokUrl || '#'} aria-label="TikTok" className="social-icon" target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                  </svg>
                </a>
              )}
            </div>

            <h4 className="footer-products-title">Sản phẩm nổi bật</h4>
            <ul className="footer-products-list">
              <li>Sữa rửa mặt tạo bọt đậu đỏ</li>
              <li>Mặt nạ tẩy tế bào chết đậu đỏ</li>
              <li>Toner dưỡng da đậu đỏ</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-newsletter">
        <div className="footer-container newsletter-grid">
          <div className="newsletter-contact">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="contact-icon">
              <path d="M22 16.92v2.4a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.6 2 2 0 0 1 4.1 1.42h2.4a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.61a2 2 0 0 1-.45 2.11L7.63 8.88a16 16 0 0 0 7.49 7.49l1.02-1.02a2 2 0 0 1 2.11-.45c.84.28 1.71.48 2.61.6A2 2 0 0 1 22 16.92Z" />
            </svg>
            <div>
              <span className="contact-label">Điện Thoại</span>
              <a href={`tel:${storeSettings.hotline}`} className="contact-value">
                {storeSettings.hotline}
              </a>
            </div>
          </div>

          <div className="newsletter-contact">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="contact-icon">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <div>
              <span className="contact-label">Email</span>
              <a href={`mailto:${storeSettings.contactEmail}`} className="contact-value">
                {storeSettings.contactEmail}
              </a>
            </div>
          </div>

          <div className="newsletter-contact">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="contact-icon">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div>
              <span className="contact-label">Địa Chỉ</span>
              <span className="contact-value address">{storeSettings.address}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-copyright">
        <div className="footer-container">
          <p>
            © 2026 Bản quyền thuộc về <strong>{storeSettings.storeName}</strong>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
