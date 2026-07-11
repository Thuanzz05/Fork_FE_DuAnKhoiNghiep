import { Link } from 'react-router-dom'
import './ShippingPolicyPage.css'

function ReturnPolicyPage() {
  return (
    <main className="shipping-policy-page">
      <nav className="policy-breadcrumb" aria-label="Đường dẫn">
        <div className="policy-container">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <strong>Chính sách đổi trả</strong>
        </div>
      </nav>

      <div className="policy-container policy-layout">
        <article className="policy-content">
          <header className="policy-heading">
            <p>Red Bean Beauty</p>
            <h1>Chính sách đổi trả</h1>
            <span aria-hidden="true" />
          </header>

          <section className="policy-introduction">
            <p>
              Red Bean Beauty luôn kiểm tra sản phẩm trước khi giao và mong muốn khách hàng có trải nghiệm mua sắm an tâm. Khi
              nhận hàng, khách hàng vui lòng kiểm tra tình trạng kiện hàng, sản phẩm và số lượng trước khi xác nhận với nhân viên
              giao hàng.
            </p>
          </section>

          <section className="policy-section">
            <div className="policy-section-title">
              <span>1</span>
              <h2>Điều kiện đổi trả</h2>
            </div>

            <p className="policy-section-note">Sản phẩm được xem xét đổi hoặc trả trong các trường hợp sau:</p>
            <ul className="policy-list">
              <li>Sản phẩm không đúng chủng loại, dung tích hoặc mẫu mã theo đơn hàng đã đặt trên website.</li>
              <li>Đơn hàng không đủ số lượng, thiếu sản phẩm trong bộ combo, phụ kiện hoặc quà tặng đi kèm.</li>
              <li>Bao bì bị rách, bong tróc, móp méo; chai lọ bị nứt, bể, rò rỉ hoặc sản phẩm có dấu hiệu hư hỏng khi nhận.</li>
              <li>Sản phẩm có lỗi chất lượng được Red Bean Beauty xác nhận sau khi tiếp nhận thông tin và kiểm tra.</li>
            </ul>

            <div className="policy-evidence-box">
              <h3>Thông tin cần cung cấp</h3>
              <p>
                Khách hàng vui lòng cung cấp mã đơn hàng, hóa đơn hoặc thông tin người nhận kèm ảnh/video mở kiện hàng thể hiện
                rõ tình trạng sản phẩm. Đây là căn cứ để Red Bean Beauty xác minh và xử lý yêu cầu nhanh chóng.
              </p>
            </div>
          </section>

          <section className="policy-section">
            <div className="policy-section-title">
              <span>2</span>
              <h2>Thời gian thông báo và gửi sản phẩm</h2>
            </div>

            <div className="delivery-time-grid">
              <div className="delivery-time-card">
                <h3>Thông báo đổi trả</h3>
                <strong>Trong vòng 48 giờ</strong>
                <p>Áp dụng khi sản phẩm bị bể vỡ, rò rỉ, giao sai hoặc thiếu sản phẩm, phụ kiện hay quà tặng.</p>
              </div>
              <div className="delivery-time-card">
                <h3>Gửi sản phẩm về</h3>
                <strong>Trong vòng 14 ngày</strong>
                <p>Tính từ ngày khách hàng nhận sản phẩm và sau khi yêu cầu đổi trả được xác nhận.</p>
              </div>
            </div>

            <ul className="policy-list">
              <li>Khách hàng có thể mang sản phẩm trực tiếp đến điểm tiếp nhận của Red Bean Beauty.</li>
              <li>
                Nếu gửi qua bưu điện hoặc đơn vị vận chuyển, khách hàng cần đóng gói sản phẩm cẩn thận và ghi rõ mã đơn hàng,
                họ tên cùng số điện thoại.
              </li>
              <li>Địa chỉ tiếp nhận: Cầu Treo, Yên Mỹ, Hưng Yên.</li>
            </ul>
          </section>

          <section className="policy-section">
            <div className="policy-section-title">
              <span>3</span>
              <h2>Quy trình xử lý đổi trả</h2>
            </div>

            <ol className="return-process">
              <li>
                <span>01</span>
                <div><h3>Gửi yêu cầu</h3><p>Liên hệ hotline hoặc email, cung cấp mã đơn và hình ảnh/video liên quan.</p></div>
              </li>
              <li>
                <span>02</span>
                <div><h3>Xác nhận thông tin</h3><p>Red Bean Beauty kiểm tra điều kiện và hướng dẫn cách gửi sản phẩm về.</p></div>
              </li>
              <li>
                <span>03</span>
                <div><h3>Kiểm tra sản phẩm</h3><p>Sản phẩm được đối chiếu với thông tin khách hàng đã cung cấp.</p></div>
              </li>
              <li>
                <span>04</span>
                <div><h3>Đổi mới hoặc hoàn tiền</h3><p>Kết quả xử lý được thông báo sau khi việc kiểm tra hoàn tất.</p></div>
              </li>
            </ol>
          </section>

          <section className="policy-section">
            <div className="policy-section-title">
              <span>4</span>
              <h2>Lưu ý đối với sản phẩm mỹ phẩm</h2>
            </div>

            <ul className="policy-list">
              <li>
                Vì lý do vệ sinh và an toàn, sản phẩm đã mở niêm phong hoặc đã qua sử dụng sẽ không được đổi trả, trừ trường hợp
                có lỗi chất lượng được Red Bean Beauty xác nhận.
              </li>
              <li>Sản phẩm gửi lại cần còn đầy đủ bao bì, phụ kiện, quà tặng và hóa đơn nếu có.</li>
              <li>
                Nếu lỗi thuộc về Red Bean Beauty hoặc đơn vị vận chuyển, Red Bean Beauty sẽ chịu chi phí đổi trả. Các trường hợp
                đổi theo nhu cầu cá nhân có thể phát sinh phí vận chuyển.
              </li>
            </ul>
          </section>
        </article>

        <aside className="policy-contact-card">
          <div className="policy-contact-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4h16v13H4zM8 21h8M12 17v4" />
              <path d="m8 10 3 3 5-6" />
            </svg>
          </div>
          <h2>Cần hỗ trợ đổi trả?</h2>
          <p>Vui lòng chuẩn bị mã đơn hàng và ảnh/video sản phẩm trước khi liên hệ.</p>
          <a href="tel:0986126955">0986126955</a>
          <a href="mailto:Hoangthingocmai2005@gmail.com">Hoangthingocmai2005@gmail.com</a>
          <Link to="/lien-he">Gửi yêu cầu hỗ trợ</Link>
        </aside>
      </div>
    </main>
  )
}

export default ReturnPolicyPage
