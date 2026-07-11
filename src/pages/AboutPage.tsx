import { Link } from 'react-router-dom'
import './AboutPage.css'

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feature-svg">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8a7 7 0 0 1-9 10Z" />
      <path d="M19 2c-2.26 4.33-5.27 7.14-8 10" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feature-svg">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feature-svg">
      <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
    </svg>
  )
}

function AboutPage() {
  return (
    <main className="about-page">
      {/* Banner Section */}
      <section className="about-hero-section">
        <div className="about-hero-image-wrapper">
          <img src="/images/banner3.png" alt="Giới thiệu Red Bean Beauty" className="about-hero-bg-img" />
          
          <div className="about-hero-overlay">
            <div className="about-container">
              {/* Breadcrumbs */}
              <nav className="about-breadcrumbs" aria-label="Breadcrumb">
                <Link to="/">Trang chủ</Link>
                <span className="separator">&gt;</span>
                <span className="current">Giới thiệu</span>
              </nav>

              {/* Text content block */}
              <div className="about-hero-content">
                <h1 className="about-hero-title">Về Red Bean Beauty</h1>
                
                <h2 className="about-hero-subtitle">
                  Chăm sóc da từ đậu đỏ –<br />
                  Lành tính, hiệu quả cho làn da Việt
                </h2>
                
                <p className="about-hero-desc">
                  Red Bean Beauty là thương hiệu chăm sóc da thuần thiên nhiên, ứng dụng sức mạnh của đậu đỏ để mang đến những sản phẩm lành tính, an toàn và hiệu quả cho làn da Việt.
                </p>

                {/* Features row */}
                <div className="about-hero-features">
                  <div className="about-hero-feature-item">
                    <div className="feature-icon-circle">
                      <LeafIcon />
                    </div>
                    <span className="feature-text">Thiên nhiên<br />lành tính</span>
                  </div>

                  <div className="about-hero-feature-item">
                    <div className="feature-icon-circle">
                      <ShieldIcon />
                    </div>
                    <span className="feature-text">Hiệu quả<br />bền vững</span>
                  </div>

                  <div className="about-hero-feature-item">
                    <div className="feature-icon-circle">
                      <DropIcon />
                    </div>
                    <span className="feature-text">An toàn cho<br />da nhạy cảm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Products Section */}
      <section className="about-products-section" aria-labelledby="products-title">
        <div className="about-container-story">
          <div className="section-title-wrapper-about">
            <span className="title-line"></span>
            <h2 id="products-title" className="section-title-about">
              3 SẢN PHẨM CHỦ LỰC CỦA CHÚNG TÔI
            </h2>
            <span className="title-line"></span>
          </div>

          <div className="about-products-grid">
            {/* Product Card 1 */}
            <div className="about-product-card">
              <div className="about-product-img-box">
                <img src="/images/sua_rua_mat1.png" alt="Sữa rửa mặt tạo bọt đậu đỏ" />
              </div>
              <div className="about-product-info">
                <h3>
                  SỮA RỬA MẶT<br />
                  TẠO BỌT ĐẬU ĐỎ
                </h3>
                <p>
                  Làm sạch sâu, loại bỏ bụi bẩn và bã nhờn, giữ da thông thoáng mà không gây khô căng.
                </p>
                <div className="about-product-mini-features">
                  <div className="mini-feature-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mini-icon">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 8a7 7 0 0 1-9 10Z" />
                    </svg>
                    <span>Làm sạch dịu nhẹ</span>
                  </div>
                  <div className="mini-feature-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mini-icon">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Cân bằng ẩm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Card 2 */}
            <div className="about-product-card">
              <div className="about-product-img-box">
                <img src="/images/tay_te_bao_chet.png" alt="Mặt nạ tẩy tế bào chết đậu đỏ" />
              </div>
              <div className="about-product-info">
                <h3>
                  MẶT NẠ<br />
                  TẨY TẾ BÀO CHẾT<br />
                  ĐẬU ĐỎ
                </h3>
                <p>
                  Loại bỏ tế bào chết, làm mịn kết cấu da, hỗ trợ dưỡng sáng và cải thiện thô ráp.
                </p>
                <div className="about-product-mini-features">
                  <div className="mini-feature-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mini-icon">
                      <path d="M16 18a4 4 0 0 0-8 0" />
                      <circle cx="12" cy="10" r="3" />
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    </svg>
                    <span>Tẩy da chết dịu nhẹ</span>
                  </div>
                  <div className="mini-feature-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mini-icon">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </svg>
                    <span>Mịn màng rạng rỡ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Card 3 */}
            <div className="about-product-card">
              <div className="about-product-img-box">
                <img src="/images/tonner.png" alt="Toner dưỡng da đậu đỏ" />
              </div>
              <div className="about-product-info">
                <h3>
                  TONER<br />
                  DƯỠNG DA ĐẬU ĐỎ
                </h3>
                <p>
                  Cân bằng độ pH, cấp ẩm sâu, làm dịu và hỗ trợ thu nhỏ lỗ chân lông.
                </p>
                <div className="about-product-mini-features">
                  <div className="mini-feature-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mini-icon">
                      <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
                    </svg>
                    <span>Cấp ẩm sâu</span>
                  </div>
                  <div className="mini-feature-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mini-icon">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Làm dịu da</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="about-story-section">
        <div className="about-container-story">
          <div className="about-story-card">
            {/* Left: Image */}
            <div className="about-story-img-box">
              <img src="/images/chung_toi.png" alt="Đội ngũ Red Bean Beauty" />
            </div>

            {/* Middle: Content */}
            <div className="about-story-content-box">
              <span className="story-kicker">✦ CÂU CHUYỆN THƯƠNG HIỆU</span>
              <h2 className="story-heading">
                Từ hạt đậu đỏ Việt,<br />
                cho làn da khỏe đẹp mỗi ngày
              </h2>
              <p>
                Red Bean Beauty được khởi nguồn từ tình yêu với thiên nhiên và làn da phụ nữ Việt. Chúng tôi tin rằng, vẻ đẹp bền vững bắt đầu từ sự lành tính và thấu hiểu làn da.
              </p>
              <p>
                Mỗi sản phẩm là kết quả của quá trình nghiên cứu kỹ lưỡng, chọn lọc nguyên liệu tự nhiên và công thức tối ưu – để làn da bạn luôn được nuôi dưỡng một cách dịu nhẹ, hiệu quả và an toàn.
              </p>
            </div>

            {/* Right: Stats list */}
            <div className="about-story-stats-box">
              <div className="story-stat-item">
                <div className="stat-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stat-svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="M12 14v4M10 16h4" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h4>2024</h4>
                  <span>Năm thành lập</span>
                </div>
              </div>

              <div className="story-stat-item">
                <div className="stat-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stat-svg">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h4>TP. Hưng Yên</h4>
                  <span>Tự hào thương hiệu Việt</span>
                </div>
              </div>

              <div className="story-stat-item">
                <div className="stat-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stat-svg">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="stat-info">
                  <h4>Hàng ngàn khách hàng</h4>
                  <span>Tin yêu và lựa chọn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Vision Values Section */}
      <section className="about-values-section" aria-labelledby="values-title">
        <div className="about-container-story">
          <div className="section-title-wrapper-about">
            <span className="title-line"></span>
            <h2 id="values-title" className="section-title-about">
              SỨ MỆNH – TẦM NHÌN – GIÁ TRỊ CỐT LÕI
            </h2>
            <span className="title-line"></span>
          </div>

          <div className="about-values-grid">
            {/* Card 1: Sứ mệnh */}
            <div className="about-value-card">
              <div className="value-icon-circle-bg">
                <LeafIcon />
              </div>
              <div className="value-info">
                <h3>SỨ MỆNH</h3>
                <p>
                  Mang đến giải pháp chăm sóc da lành tính từ thiên nhiên, giúp phụ nữ Việt tự tin với làn da khỏe mạnh mỗi ngày.
                </p>
              </div>
            </div>

            {/* Card 2: Tầm nhìn */}
            <div className="about-value-card">
              <div className="value-icon-circle-bg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feature-svg">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <div className="value-info">
                <h3>TẦM NHÌN</h3>
                <p>
                  Trở thành thương hiệu chăm sóc da thiên nhiên hàng đầu Việt Nam, được tin yêu bởi chất lượng, sự minh bạch và trách nhiệm với cộng đồng.
                </p>
              </div>
            </div>

            {/* Card 3: Giá trị cốt lõi */}
            <div className="about-value-card">
              <div className="value-icon-circle-bg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feature-svg">
                  <path d="M6 3h12l4 6-10 13L2 9z" />
                  <path d="M11 3 8 9l4 13 4-13-3-6" />
                  <path d="M2 9h20" />
                </svg>
              </div>
              <div className="value-info">
                <h3>GIÁ TRỊ CỐT LÕI</h3>
                <ul className="value-bullets">
                  <li>Lành tính – Hiệu quả – An toàn</li>
                  <li>Minh bạch trong mọi cam kết</li>
                  <li>Tôn trọng thiên nhiên và con người</li>
                  <li>Không ngừng đổi mới để phục vụ tốt hơn</li>
                </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Partner Section (Cỏ Cây Hoa Lá) */}
      <section className="about-partner-section" aria-labelledby="partner-title">
        <div className="about-container-story">
          <div className="about-partner-banner-wrapper">
            <img src="/images/doi_tac.png" alt="Đối tác Cỏ Cây Hoa Lá" className="about-partner-bg-img" />
            
            <div className="about-partner-overlay">
              <div className="about-partner-content">
                <span className="partner-badge-pill">ĐỐI TÁC NGUYÊN LIỆU TIN CẬY</span>
                <h2 id="partner-title" className="partner-brand-name">Cỏ Cây Hoa Lá</h2>
                <h3 className="partner-brand-sub">Nhà cung cấp nguyên liệu thiên nhiên</h3>
                <p className="partner-brand-desc">
                  Chúng tôi tự hào hợp tác cùng Cỏ Cây Hoa Lá – đơn vị uy tín trong lĩnh vực cung cấp nguyên liệu thiên nhiên chất lượng cao, đạt tiêu chuẩn an toàn và thân thiện với làn da.
                </p>

                {/* Four mini features */}
                <div className="about-partner-features">
                  <div className="partner-feature-item">
                    <div className="partner-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a15 15 0 0 0-10 8c0 4.42 3 8 10 12 7-4 10-7.58 10-12a15 15 0 0 0-10-8z" />
                      </svg>
                    </div>
                    <span>Nguồn gốc<br />rõ ràng</span>
                  </div>

                  <div className="partner-feature-item">
                    <div className="partner-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </div>
                    <span>Chất lượng<br />kiểm định</span>
                  </div>

                  <div className="partner-feature-item">
                    <div className="partner-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <span>An toàn<br />lành tính</span>
                  </div>

                  <div className="partner-feature-item">
                    <div className="partner-icon-circle">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2h12M12 2v6M10 8h4M8 8v11a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V8" />
                      </svg>
                    </div>
                    <span>Hỗ trợ<br />nghiên cứu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Commitments Section */}
      <section className="about-commitments-section" aria-labelledby="commitments-title">
        <div className="about-container-story">
          <div className="section-title-wrapper-about">
            <span className="title-line"></span>
            <h2 id="commitments-title" className="section-title-about">
              GIÁ TRỊ SẢN PHẨM – CAM KẾT CỦA CHÚNG TÔI
            </h2>
            <span className="title-line"></span>
          </div>

          <div className="about-commitments-grid">
            {/* Card 1: Thiên nhiên lành tính */}
            <div className="commitment-card">
              <div className="commitment-card-header">
                <div className="commitment-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 22c1.25-3.33 3.5-5.5 7-6.5a14 14 0 0 1 13-13.5 14 14 0 0 1-13.5 13c-1 3.5-3.17 5.75-6.5 7" />
                    <path d="M9 15.5 A 5.5 5.5 0 0 1 14.5 10" />
                  </svg>
                </div>
                <div className="commitment-card-info">
                  <h4>Thiên nhiên lành tính</h4>
                  <p>
                    Chiết xuất từ đậu đỏ và các thành phần thiên nhiên, dịu nhẹ cho mọi làn da.
                  </p>
                </div>
              </div>
              <div className="commitment-card-img-wrapper">
                <img src="/images/cam_ket_1.png" alt="Thiên nhiên lành tính" className="commitment-card-img" />
              </div>
            </div>

            {/* Card 2: An toàn cho da */}
            <div className="commitment-card">
              <div className="commitment-card-header">
                <div className="commitment-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div className="commitment-card-info">
                  <h4>An toàn cho da</h4>
                  <p>
                    Không paraben, không cồn khô, không hương liệu gây kích ứng.
                  </p>
                </div>
              </div>
              <div className="commitment-card-img-wrapper">
                <img src="/images/cam_ket_2.png" alt="An toàn cho da" className="commitment-card-img" />
              </div>
            </div>

            {/* Card 3: Phù hợp làn da Việt */}
            <div className="commitment-card">
              <div className="commitment-card-header">
                <div className="commitment-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 0 0-7 7c0 3.37 2 6 5 6.75V20a2 2 0 0 0 4 0v-4.25c3-.75 5-3.38 5-6.75a7 7 0 0 0-7-7z" />
                  </svg>
                </div>
                <div className="commitment-card-info">
                  <h4>Phù hợp làn da Việt</h4>
                  <p>
                    Công thức nghiên cứu riêng, tối ưu hiệu quả trên khí hậu & làn da Việt.
                  </p>
                </div>
              </div>
              <div className="commitment-card-img-wrapper">
                <img src="/images/cam_ket_3.png" alt="Phù hợp làn da Việt" className="commitment-card-img" />
              </div>
            </div>

            {/* Card 4: Nguồn gốc rõ ràng */}
            <div className="commitment-card">
              <div className="commitment-card-header">
                <div className="commitment-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="7" />
                    <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
                    <path d="m9 7 2 2 4-4" />
                  </svg>
                </div>
                <div className="commitment-card-info">
                  <h4>Nguồn gốc rõ ràng</h4>
                  <p>
                    Minh bạch từ nguyên liệu đến quy trình sản xuất.
                  </p>
                </div>
              </div>
              <div className="commitment-card-img-wrapper">
                <img src="/images/cam_ket_4.png" alt="Nguồn gốc rõ ràng" className="commitment-card-img" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AboutPage
