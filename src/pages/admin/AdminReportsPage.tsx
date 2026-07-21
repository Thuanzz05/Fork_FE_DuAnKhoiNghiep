import { useEffect, useState } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import { formatPrice } from '../../data/products'
import { api } from '../../services/api'
import './AdminReportsPage.css'

type ReportData = {
  summary: Record<string, number>
  periods: Record<string, { stats: Record<string, number>; bestSellingProducts: Array<{ name: string; sold: number }> }>
  lowStock: Array<{ name: string; stock: number; minimumStock: number }>
}

function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { void api.get<ReportData>('/admin/dashboard').then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể tải báo cáo')) }, [])
  const exportCsv = () => {
    if (!data) return
    const rows = [['Chỉ số', 'Giá trị'], ...Object.entries(data.summary)]
    const blob = new Blob([`\uFEFF${rows.map((row) => row.join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'bao-cao-rubeanora.csv'; link.click(); URL.revokeObjectURL(link.href)
  }
  const stats = data?.periods?.month?.stats || {}
  return <AdminLayout activeItem="reports">
    <div className="admin-page-heading admin-reports-heading"><div><p>BÁO CÁO KINH DOANH</p><h1>Báo cáo</h1><span>Số liệu thật được tổng hợp từ đơn hàng và tồn kho.</span></div><button type="button" onClick={exportCsv} disabled={!data}>Xuất CSV</button></div>
    {error ? <section className="admin-panel"><p>{error}</p></section> : null}
    {data ? <>
      <section className="admin-order-summary">
        <article><span className="is-green"><AdminIcon name="revenue" /></span><div><small>Doanh thu tháng</small><strong>{formatPrice(Number(stats.revenue || data.summary.monthly_revenue || 0))}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="orders" /></span><div><small>Tổng đơn</small><strong>{data.summary.total_orders || 0}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="calendar" /></span><div><small>Đơn chờ xác nhận</small><strong>{data.summary.pending_orders || 0}</strong></div></article>
        <article><span className="is-red"><AdminIcon name="box" /></span><div><small>Sản phẩm sắp hết</small><strong>{data.summary.low_stock_products || 0}</strong></div></article>
      </section>
      <section className="admin-panel"><div className="admin-panel-header"><div><h2>Sản phẩm bán chạy</h2>{(data.periods?.month?.bestSellingProducts || []).map((item) => <p key={item.name}>{item.name}: <strong>{item.sold}</strong> sản phẩm</p>)}</div><AdminIcon name="report" /></div></section>
      <section className="admin-panel"><div className="admin-panel-header"><div><h2>Cảnh báo tồn kho</h2>{data.lowStock.map((item) => <p key={item.name}>{item.name}: <strong>{item.stock}</strong> / ngưỡng {item.minimumStock}</p>)}</div><AdminIcon name="box" /></div></section>
    </> : null}
  </AdminLayout>
}
export default AdminReportsPage
