import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import './AdminReportsPage.css'

function AdminReportsPage() {
  return (
    <AdminLayout activeItem="reports">
      <div className="admin-page-heading admin-reports-heading">
        <div>
          <p>BÁO CÁO KINH DOANH</p>
          <h1>Báo cáo</h1>
          <span>Trang này chỉ hiển thị số liệu thật từ hệ thống.</span>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Chưa có dữ liệu báo cáo</h2>
            <p>Khi có đơn hàng và API báo cáo được cung cấp, số liệu sẽ xuất hiện tại đây.</p>
          </div>
          <AdminIcon name="report" />
        </div>
      </section>
    </AdminLayout>
  )
}

export default AdminReportsPage
