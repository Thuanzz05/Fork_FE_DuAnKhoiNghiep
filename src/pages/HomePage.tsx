import './HomePage.css'
import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-content">
          <p className="home-eyebrow">Red Bean Beauty</p>
          <h1 id="home-title">Chăm sóc da từ hạt đậu đỏ Việt Nam</h1>
          <p>
            Bộ sản phẩm gồm sữa rửa mặt tạo bọt, mặt nạ tẩy tế bào chết và toner
            dưỡng da đậu đỏ cho chu trình chăm sóc da dịu nhẹ mỗi ngày.
          </p>
          <div className="home-actions">
            <Link to="/san-pham">Khám phá sản phẩm</Link>
            <Link to="/san-pham/combo-cham-soc-da-toan-dien-dau-do-3-mon-150g">Xem combo</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
