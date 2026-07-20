import './HomePage.css'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { addCartItem } from '../utils/cart'
import { formatPrice } from '../data/products'
import type { NewsArticle } from '../data/news'
import { useCatalog } from '../hooks/useCatalog'
import { api } from '../services/api'

const testimonials = [
  {
    id: 'lan-anh',
    name: 'Lan Anh',
    purchasedProduct: 'Đã mua combo Full Care',
    avatarColor: '#b53740',
    comment: 'Da mình cải thiện rõ rệt sau 2 tuần sử dụng. Sản phẩm lành tính, không gây kích ứng.',
    productImage: '/images/products/combo_ref1.png',
    productAlt: 'Combo chăm sóc da đậu đỏ',
  },
  {
    id: 'ngoc-han',
    name: 'Ngọc Hân',
    purchasedProduct: 'Đã mua Toner Đậu Đỏ',
    avatarColor: '#9d4960',
    comment: 'Toner thấm nhanh, không nhờn rít. Mùi thơm nhẹ, rất dễ chịu và da mềm hơn rõ rệt.',
    productImage: '/images/products/toner-duong-da6.png',
    productAlt: 'Toner dưỡng da đậu đỏ',
  },
  {
    id: 'duc-minh',
    name: 'Đức Minh',
    purchasedProduct: 'Đã mua Sữa rửa mặt Đậu Đỏ',
    avatarColor: '#386f5b',
    comment: 'Rửa mặt sạch sâu nhưng không khô da. Dùng buổi sáng và tối đều rất dễ chịu.',
    productImage: '/images/products/sua-rua-mat-tao-bot4.png',
    productAlt: 'Sữa rửa mặt tạo bọt đậu đỏ',
  },
  {
    id: 'khanh-linh',
    name: 'Khánh Linh',
    purchasedProduct: 'Đã mua Combo dưỡng da mini',
    avatarColor: '#c05b64',
    comment: 'Bộ mini rất tiện để mang đi du lịch. Chất kem nhẹ, thấm nhanh và không gây bí da.',
    productImage: '/images/products/combo-duong-da-mini.png',
    productAlt: 'Combo dưỡng da đậu đỏ mini',
  },
  {
    id: 'bao-ngoc',
    name: 'Bảo Ngọc',
    purchasedProduct: 'Đã mua Mặt nạ Đậu Đỏ',
    avatarColor: '#7f506c',
    comment: 'Sau khi dùng da mịn và sáng hơn, hạt tẩy dịu nhẹ. Mình sẽ tiếp tục ủng hộ sản phẩm.',
    productImage: '/images/products/mat-na-tay-te-bao-chet4.png',
    productAlt: 'Mặt nạ tẩy tế bào chết đậu đỏ',
  },
  {
    id: 'thanh-tam',
    name: 'Thanh Tâm',
    purchasedProduct: 'Đã mua Combo chăm sóc da 3 món',
    avatarColor: '#a56b42',
    comment: 'Quy trình chăm sóc đơn giản, sản phẩm dùng êm và phù hợp với da nhạy cảm của mình.',
    productImage: '/images/products/combo-3mon5.png',
    productAlt: 'Combo chăm sóc da đậu đỏ 3 món',
  },
]

function getNameInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toLocaleUpperCase('vi-VN')
}

function HomePage() {
  const { products } = useCatalog()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const bestSellers = products.slice(0, 5)
  const featuredCombo = products.find((product) => product.isCombo)

  useEffect(() => {
    api.get<{ articles: NewsArticle[] }>('/news')
      .then((data) => setArticles(data.articles))
      .catch(() => setArticles([]))
  }, [])

  const handleAddToCart = (productId: string) => {
    addCartItem(productId, 1)
  }

  const scrollTestimonials = (direction: -1 | 1) => {
    const container = testimonialsRef.current
    const card = container?.querySelector<HTMLElement>('.testimonial-card')

    if (!container || !card) return

    const styles = window.getComputedStyle(container)
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 16
    const maxScrollLeft = container.scrollWidth - container.clientWidth

    if (direction === 1 && container.scrollLeft >= maxScrollLeft - 4) {
      container.scrollTo({ left: 0, behavior: 'smooth' })
      return
    }

    if (direction === -1 && container.scrollLeft <= 4) {
      container.scrollTo({ left: maxScrollLeft, behavior: 'smooth' })
      return
    }

    container.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: 'smooth',
    })
  }

  return (
    <main className="home-page">
      <section className="home-hero" aria-label="Combo Chăm Sóc Da Đậu Đỏ Hữu Cơ">
        <div className="hero-image-wrapper">
          <img
            src="/images/banner1.png"
            alt="Combo Chăm Sóc Da Đậu Đỏ Hữu Cơ - Sạch mụn, trắng hồng, mướt mịn"
            className="hero-banner-image"
          />
          {/* Centered content container aligning left brand text with header 'Trang chủ' */}
          <div className="hero-content-container">
            {/* Left content overlay (Title, Pill, Italic Text, Features, Button) */}
            <div className="hero-content-left">
              <h1 className="hero-title">
                COMBO CHĂM SÓC DA<br />
                TỪ ĐẬU ĐỎ HỮU CƠ
              </h1>

              <div className="hero-badge-pill">
                SẠCH MỤN - TRẮNG HỒNG - MƯỚT MỊN
              </div>

              <div className="hero-subtext-italic">
                AN TOÀN - LÀNH TÍNH - DỊU NHẸ
              </div>

              <div className="hero-features-row">
                <div className="hero-feature-item">
                  <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c-2.48 5-3 6.5-4.1 12.2A7 7 0 0 1 11 20z"></path>
                    <path d="M9 22l3-3M6 19l2-2"></path>
                  </svg>
                  <div className="feature-text">
                    <span className="bold-text">100%</span>
                    <span className="light-text">Thiên nhiên</span>
                  </div>
                </div>

                <div className="hero-feature-item">
                  <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"></path>
                    <path d="M12 12a2.5 2.5 0 0 1 2.5 2.5"></path>
                  </svg>
                  <div className="feature-text">
                    <span className="bold-text">Không</span>
                    <span className="light-text">paraben</span>
                  </div>
                </div>

                <div className="hero-feature-item">
                  <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 11a1.5 1.5 0 0 1 3 0M13 11a1.5 1.5 0 0 1 3 0"></path>
                    <path d="M10 15a2 2 0 0 0 4 0"></path>
                  </svg>
                  <div className="feature-text">
                    <span className="bold-text">Phù hợp</span>
                    <span className="light-text">mọi loại da</span>
                  </div>
                </div>
              </div>

              <Link to="/san-pham/combo-cham-soc-da-toan-dien-dau-do-3-mon-150g" className="hero-btn-green">
                <span>MUA NGAY</span>
                <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar / Service features row */}
      <section className="home-trust-bar">
        <div className="trust-bar-container">
          <div className="trust-item">
            <div className="trust-icon">
              {/* Delivery Truck Icon */}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <div className="trust-text">
              <h3>Giao hàng nhanh</h3>
              <p>Toàn quốc 1–3 ngày</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon">
              {/* Return arrow/box icon */}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
            </div>
            <div className="trust-text">
              <h3>Đổi trả dễ dàng</h3>
              <p>Trong 7 ngày miễn phí</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon">
              {/* Leaves icon */}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c-2.48 5-3 6.5-4.1 12.2A7 7 0 0 1 11 20z"></path>
                <path d="M9 22l3-3M6 19l2-2"></path>
              </svg>
            </div>
            <div className="trust-text">
              <h3>Thiên nhiên lành tính</h3>
              <p>An toàn cho mọi loại da</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon">
              {/* Support agent headset icon */}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <path d="M12 7v5M12 15h.01"></path>
              </svg>
            </div>
            <div className="trust-text">
              <h3>Tư vấn tận tâm</h3>
              <p>Hỗ trợ 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection Section */}
      <section className="home-featured-collection">
        <div className="home-container">
          <div className="featured-section-title-wrapper">
            <h2 className="featured-section-title">
              BỘ SƯU TẬP NỔI BẬT
              <svg className="leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c-2.48 5-3 6.5-4.1 12.2A7 7 0 0 1 11 20z"></path>
              </svg>
            </h2>
          </div>

          <div className="featured-collection-layout">
            {/* Large card on the left */}
            {featuredCombo ? (
              <div className="featured-large-card">
                {featuredCombo.discount ? <span className="large-card-badge">TIẾT KIỆM {featuredCombo.discount}%</span> : null}
                <div className="large-card-content">
                  <div className="large-card-image-box">
                    <img src={featuredCombo.image} alt={featuredCombo.name} />
                  </div>
                  <div className="large-card-info-box">
                    <h3 className="large-card-title">{featuredCombo.name}</h3>
                    {featuredCombo.weight ? <span className="large-card-subtitle">{featuredCombo.weight}</span> : null}
                    {featuredCombo.description ? <ul className="large-card-bullets"><li>{featuredCombo.description}</li></ul> : null}
                    <div className="large-card-pricing">
                      <span className="price-red">{formatPrice(featuredCombo.price)}</span>
                      {featuredCombo.originalPrice ? <span className="price-strike">{formatPrice(featuredCombo.originalPrice)}</span> : null}
                    </div>
                    <button
                      type="button"
                      className="large-card-btn-add"
                      onClick={() => handleAddToCart(featuredCombo.id)}
                      aria-label={`Thêm ${featuredCombo.name} vào giỏ hàng`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="featured-large-card">Chưa có sản phẩm combo.</div>
            )}

            {/* Three smaller columns on the right */}
            <div className="featured-side-columns">
              <div className="side-column-item">
                <div className="side-column-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="side-icon">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c-2.48 5-3 6.5-4.1 12.2A7 7 0 0 1 11 20z"></path>
                    <path d="M9 22l3-3M6 19l2-2"></path>
                  </svg>
                </div>
                <h4 className="side-column-title">Làm sạch sâu</h4>
                <p className="side-column-desc">Loại bỏ bụi bẩn, bã nhờn và tạp chất.</p>
              </div>

              <div className="side-column-item">
                <div className="side-column-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="side-icon">
                    <path d="M12 3c0 4.5 1.5 6 6 6-4.5 0-6 1.5-6 6 0-4.5-1.5-6-6-6 4.5 0 6-1.5 6-6zM5 16c0 1.5.5 2 2 2-1.5 0-2 .5-2 2 0-1.5-.5-2-2-2 1.5 0 2-.5 2-2zM19 5c0 1.5.5 2 2 2-1.5 0-2 .5-2 2 0-1.5-.5-2-2-2 1.5 0 2-.5 2-2z"></path>
                  </svg>
                </div>
                <h4 className="side-column-title">Tẩy da chết dịu nhẹ</h4>
                <p className="side-column-desc">Làm mịn, sáng da, hỗ trợ thu nhỏ lỗ chân lông.</p>
              </div>

              <div className="side-column-item">
                <div className="side-column-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="side-icon">
                    <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z"></path>
                  </svg>
                </div>
                <h4 className="side-column-title">Cấp ẩm & cân bằng</h4>
                <p className="side-column-desc">Giúp da ẩm mượt, khỏe mạnh mỗi ngày.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="home-best-sellers">
        <div className="home-container">
          <div className="section-header">
            <h2 className="section-title">
              SẢN PHẨM BÁN CHẠY
              <svg className="leaf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c-2.48 5-3 6.5-4.1 12.2A7 7 0 0 1 11 20z"></path>
              </svg>
            </h2>
            <Link to="/san-pham" className="view-all-link">
              <span>Xem tất cả</span>
              <svg className="circle-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 8 16 12 12 16"></polyline>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </Link>
          </div>

          <div className="best-sellers-grid-5">
            {bestSellers.map((item) => (
              <article className="best-seller-card-new" key={item.id}>
                {item.discount ? <span className="card-badge-discount">TIẾT KIỆM {item.discount}%</span> : null}

                <div className="card-image-wrapper-new">
                  <Link to={`/san-pham/${item.slug}`}>
                    <img src={item.image} alt={item.name} loading="lazy" />
                  </Link>
                </div>

                <div className="card-info-new">
                  <Link to={`/san-pham/${item.slug}`} className="card-name-link-new">
                    <h3 className="card-title-text-new">{item.name}</h3>
                  </Link>

                  {item.weight ? <span className="card-subtitle-text-new">{item.weight}</span> : null}

                  <div className="card-pricing-row-new">
                    <div className="price-container-new">
                      <span className="card-price-new">{formatPrice(item.price)}</span>
                      {item.originalPrice && (
                        <span className="card-price-strike-new">{formatPrice(item.originalPrice)}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="card-cart-btn-new"
                      onClick={() => handleAddToCart(item.id)}
                      aria-label="Thêm vào giỏ hàng"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {bestSellers.length === 0 ? <p>Chưa có sản phẩm.</p> : null}
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="home-brand-story" aria-labelledby="brand-title">
        <div className="brand-image-wrapper">
          <img src="/images/thuong_hieu1.png" alt="Về thương hiệu Red Bean Beauty" className="brand-bg-image" />

          <div className="brand-content-overlay">
            {/* Top Brand Story Overlay */}
            <div className="brand-overlay-inner">
              <span className="brand-kicker">VỀ THƯƠNG HIỆU</span>
              <h2 id="brand-title" className="brand-title">
                Vẻ đẹp tự nhiên bắt đầu<br />
                từ sự <span className="highlight-pink">lành tính</span>
              </h2>
              <p className="brand-desc">
                RED BEAN BEAUTY tin rằng làn da khỏe đẹp bắt nguồn từ thiên nhiên và sự lành tính. Chúng tôi chọn đậu đỏ – nguyên liệu giàu dưỡng chất truyền thống – kết hợp cùng công thức hiện đại để tạo nên những sản phẩm sạch, hiệu quả và an toàn cho mọi loại da.
              </p>

              <div className="brand-features">
                <div className="brand-feature-item">
                  <div className="brand-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 22 2c-2.48 5-3 6.5-4.1 12.2A7 7 0 0 1 11 20z"></path>
                    </svg>
                  </div>
                  <div className="brand-feature-text">
                    <strong>Chiết xuất đậu đỏ</strong>
                    <span>Thiên nhiên</span>
                  </div>
                </div>

                <div className="brand-feature-item">
                  <div className="brand-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
                    </svg>
                  </div>
                  <div className="brand-feature-text">
                    <strong>Công thức</strong>
                    <span>Lành tính</span>
                  </div>
                </div>

                <div className="brand-feature-item">
                  <div className="brand-feature-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 8v4l3 3"></path>
                    </svg>
                  </div>
                  <div className="brand-feature-text">
                    <strong>Thuần chay</strong>
                    <span>và Bền vững</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Partner Overlay (placed directly on top of the image's card) */}
            <div className="brand-partner-overlay">
              <div className="partner-info-overlay">
                <span className="partner-kicker-new">ĐỐI TÁC NGUYÊN LIỆU TIN CẬY</span>
                <h3 className="partner-title-new">CỎ CÂY HOA LÁ</h3>
                <p className="partner-desc-new">
                  Chúng tôi tự hào hợp tác cùng CỎ CÂY HOA LÁ – đơn vị cung cấp nguyên liệu thiên nhiên chất lượng cao, đạt tiêu chuẩn an toàn và bền vững cho ngành mỹ phẩm.
                </p>
              </div>

              {/* Text labels positioned directly below the circular icons baked into the image */}
              <div className="partner-label-overlay label-pos-1">
                <span className="pillar-text-new">Nguồn gốc<br />rõ ràng</span>
              </div>

              <div className="partner-label-overlay label-pos-2">
                <span className="pillar-text-new">Công thức<br />chất lượng</span>
              </div>

              <div className="partner-label-overlay label-pos-3">
                <span className="pillar-text-new">Cam kết<br />bền vững</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="home-testimonials" aria-labelledby="testimonials-title">
        <div className="home-container">
          <div className="testimonials-header">
            <h2 id="testimonials-title" className="testimonials-section-title">
              KHÁCH HÀNG NÓI GÌ VỀ CHÚNG TÔI
            </h2>
          </div>

          <div className="testimonials-carousel-wrapper">
            <button
              type="button"
              className="carousel-btn btn-left"
              aria-label="Xem đánh giá trước"
              onClick={() => scrollTestimonials(-1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div
              ref={testimonialsRef}
              className="testimonials-grid"
              aria-label="Danh sách đánh giá của khách hàng"
            >
              {testimonials.map((testimonial) => (
                <article className="testimonial-card" key={testimonial.id}>
                  <div className="testimonial-user-info">
                    <span
                      className="testimonial-avatar"
                      style={{ backgroundColor: testimonial.avatarColor }}
                      aria-hidden="true"
                    >
                      {getNameInitials(testimonial.name)}
                    </span>
                    <div className="testimonial-user-meta">
                      <strong className="user-name">{testimonial.name}</strong>
                      <span className="purchased-product">{testimonial.purchasedProduct}</span>
                    </div>
                  </div>

                  <div className="testimonial-rating" aria-label="5 trên 5 sao">
                    {Array.from({ length: 5 }, (_, index) => (
                      <svg
                        key={index}
                        viewBox="0 0 24 24"
                        className="testimonial-star-icon"
                        aria-hidden="true"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    ))}
                  </div>

                  <p className="testimonial-comment">{testimonial.comment}</p>

                  <div className="testimonial-product-thumb">
                    <img src={testimonial.productImage} alt={testimonial.productAlt} loading="lazy" />
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="carousel-btn btn-right"
              aria-label="Xem đánh giá tiếp theo"
              onClick={() => scrollTestimonials(1)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Natural Beauty Blog Section */}
      <section className="home-news" aria-labelledby="news-title">
        <div className="home-container">
          <div className="news-header">
            <h2 id="news-title" className="news-section-title">
              BÍ QUYẾT LÀM ĐẸP TỰ NHIÊN
            </h2>
            <Link to="/tin-tuc" className="news-view-all-btn">
              Xem tất cả bài viết
            </Link>
          </div>

          <div className="news-grid-4">
            {articles.slice(0, 4).map((article) => (
              <article className="news-card" key={article.id}>
                <div className="news-card-image-box">
                  <Link to={`/tin-tuc/${article.id}`} aria-label={article.title}>
                    <img
                      src={article.image}
                      alt={article.title}
                      className="news-card-image"
                    />
                  </Link>
                </div>
                <div className="news-card-content">
                  <span className="news-card-date">{article.date}</span>
                  <h3 className="news-card-title">
                    <Link to={`/tin-tuc/${article.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {article.title}
                    </Link>
                  </h3>
                  <Link to={`/tin-tuc/${article.id}`} className="news-card-more">
                    Đọc thêm <span>&rarr;</span>
                  </Link>
                </div>
              </article>
            ))}
            {articles.length === 0 ? <p>Chưa có bài viết.</p> : null}
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
