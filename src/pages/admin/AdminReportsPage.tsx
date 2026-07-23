import { useEffect, useMemo, useState } from 'react'
import AdminLayout, { AdminIcon, type AdminIconName } from '../../components/AdminLayout'
import { api } from '../../services/api'
import { useStoreSettings } from '../../utils/storeSettings'
import './AdminReportsPage.css'

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year'

interface ReportStats {
  revenue: number
  netRevenue: number
  costOfGoodsSold: number
  grossProfit: number
  grossMargin: number
  orders: number
  customers: number
  units_sold: number
}

interface ReportChanges {
  revenue: number
  netRevenue: number
  costOfGoodsSold: number
  grossProfit: number
  orders: number
  customers: number
  unitsSold: number
}

interface RevenuePoint {
  bucket: number
  revenue: number
  netRevenue: number
  costOfGoodsSold: number
  grossProfit: number
  grossMargin: number
}

interface OrderStatusStats {
  total: number
  completed: number
  processing: number
  pending: number
  cancelled: number
}

interface BestSellingProduct {
  id: string | null
  name: string
  sold: number
}

interface ReportPeriodData {
  stats: ReportStats
  previousStats?: ReportStats
  changes: ReportChanges
  revenueSeries: RevenuePoint[]
  orderStatus: OrderStatusStats
  bestSellingProducts: BestSellingProduct[]
}

interface LowStockProduct {
  id: string
  productCode: string
  sku: string
  name: string
  stock: number
  minimumStock: number
}

interface ReportData {
  summary: Record<string, number>
  periods: Record<ReportPeriod, ReportPeriodData>
  lowStock: LowStockProduct[]
}

const emptyPeriod: ReportPeriodData = {
  stats: { revenue: 0, netRevenue: 0, costOfGoodsSold: 0, grossProfit: 0, grossMargin: 0, orders: 0, customers: 0, units_sold: 0 },
  previousStats: { revenue: 0, netRevenue: 0, costOfGoodsSold: 0, grossProfit: 0, grossMargin: 0, orders: 0, customers: 0, units_sold: 0 },
  changes: { revenue: 0, netRevenue: 0, costOfGoodsSold: 0, grossProfit: 0, orders: 0, customers: 0, unitsSold: 0 },
  revenueSeries: [],
  orderStatus: { total: 0, completed: 0, processing: 0, pending: 0, cancelled: 0 },
  bestSellingProducts: [],
}

const periodComparison: Record<ReportPeriod, string> = {
  week: 'so với 7 ngày trước',
  month: 'so với tháng trước',
  quarter: 'so với quý trước',
  year: 'so với năm trước',
}

const bucketCount: Record<ReportPeriod, number> = {
  week: 7,
  month: 5,
  quarter: 3,
  year: 4,
}

const orderStatusLabels: Record<string, string> = {
  completed: 'Đã giao',
  processing: 'Đang xử lý',
  pending: 'Chờ xác nhận',
  cancelled: 'Đã hủy',
}

const orderStatusColors: Record<string, string> = {
  completed: '#3f8d70',
  processing: '#4f84bd',
  pending: '#d49a43',
  cancelled: '#b53740',
}

const formatMoney = (value: number) => `${Math.round(Number(value || 0)).toLocaleString('vi-VN')}đ`
const formatProfit = (value: number) => value < 0 ? `Lỗ ${formatMoney(Math.abs(value))}` : `Lãi ${formatMoney(value)}`

const estimatePreviousValue = (current: number, change: number) => {
  if (current === 0 || change === 100 || change <= -100) return 0
  return Math.max(0, Math.round(current / (1 + change / 100)))
}

const getPeriodLabel = (period: ReportPeriod) => {
  const now = new Date()
  if (period === 'week') return '7 ngày gần đây'
  if (period === 'month') return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`
  if (period === 'quarter') return `Quý ${Math.floor(now.getMonth() / 3) + 1}/${now.getFullYear()}`
  return `Năm ${now.getFullYear()}`
}

const getBucketLabel = (period: ReportPeriod, bucket: number) => {
  if (period === 'week') {
    const date = new Date()
    date.setDate(date.getDate() - (7 - bucket))
    return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit' }).format(date)
  }
  if (period === 'month') return `Tuần ${bucket}`
  if (period === 'quarter') {
    const firstMonth = Math.floor(new Date().getMonth() / 3) * 3 + 1
    return `Tháng ${firstMonth + bucket - 1}`
  }
  return `Quý ${bucket}`
}

const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

const chartWidth = 860
const chartHeight = 300
const chartPadding = { top: 34, right: 24, bottom: 52, left: 70 }

function AdminReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exported, setExported] = useState(false)
  const storeSettings = useStoreSettings()

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get<ReportData>('/admin/dashboard')
      .then((result) => {
        if (!active) return
        setData(result)
        setError('')
      })
      .catch((reason) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : 'Không thể tải báo cáo')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const report = data?.periods?.[period] ?? emptyPeriod
  const previousStats = report.previousStats ?? {
    revenue: estimatePreviousValue(report.stats.revenue, report.changes.revenue),
    netRevenue: estimatePreviousValue(report.stats.netRevenue, report.changes.netRevenue),
    costOfGoodsSold: estimatePreviousValue(report.stats.costOfGoodsSold, report.changes.costOfGoodsSold),
    grossProfit: estimatePreviousValue(report.stats.grossProfit, report.changes.grossProfit),
    grossMargin: 0,
    orders: estimatePreviousValue(report.stats.orders, report.changes.orders),
    customers: estimatePreviousValue(report.stats.customers, report.changes.customers),
    units_sold: estimatePreviousValue(report.stats.units_sold, report.changes.unitsSold),
  }
  const periodLabel = getPeriodLabel(period)
  const comparison = periodComparison[period]

  const revenueSeries = useMemo(() => {
    const values = new Map(report.revenueSeries.map((item) => [item.bucket, item]))
    return Array.from({ length: bucketCount[period] }, (_, index) => ({
      bucket: index + 1,
      label: getBucketLabel(period, index + 1),
      netRevenue: values.get(index + 1)?.netRevenue ?? 0,
      grossProfit: values.get(index + 1)?.grossProfit ?? 0,
    }))
  }, [period, report.revenueSeries])

  const comparisonRows: Array<{
    label: string
    current: string
    previous: string
    change: number
    icon: AdminIconName
    tone: string
    changeSuffix?: string
    inverseTrend?: boolean
  }> = [
    { label: 'Doanh thu thuần', current: formatMoney(report.stats.netRevenue), previous: formatMoney(previousStats.netRevenue), change: report.changes.netRevenue, icon: 'revenue', tone: 'red' },
    { label: 'Giá vốn hàng bán', current: formatMoney(report.stats.costOfGoodsSold), previous: formatMoney(previousStats.costOfGoodsSold), change: report.changes.costOfGoodsSold, inverseTrend: true, icon: 'box', tone: 'orange' },
    { label: 'Lãi / lỗ gộp', current: formatProfit(report.stats.grossProfit), previous: formatProfit(previousStats.grossProfit), change: report.changes.grossProfit, icon: 'report', tone: report.stats.grossProfit < 0 ? 'red' : 'green' },
    { label: 'Tỷ suất lãi gộp', current: `${report.stats.grossMargin.toLocaleString('vi-VN')}%`, previous: `${previousStats.grossMargin.toLocaleString('vi-VN')}%`, change: Math.round((report.stats.grossMargin - previousStats.grossMargin) * 10) / 10, changeSuffix: ' điểm %', icon: 'revenue', tone: report.stats.grossMargin < 0 ? 'red' : 'green' },
    { label: 'Đơn hàng phát sinh', current: report.stats.orders.toLocaleString('vi-VN'), previous: previousStats.orders.toLocaleString('vi-VN'), change: report.changes.orders, icon: 'orders', tone: 'blue' },
    { label: 'Sản phẩm đã bán', current: report.stats.units_sold.toLocaleString('vi-VN'), previous: previousStats.units_sold.toLocaleString('vi-VN'), change: report.changes.unitsSold, icon: 'box', tone: 'orange' },
  ]

  const statusRows = (['completed', 'processing', 'pending', 'cancelled'] as const).map((key) => {
    const count = report.orderStatus[key] || 0
    const total = report.orderStatus.total || 0
    return {
      key,
      label: orderStatusLabels[key],
      count,
      share: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      color: orderStatusColors[key],
    }
  })

  const chartMaximum = Math.max(Math.ceil(Math.max(...revenueSeries.map((item) => Math.max(item.netRevenue, item.grossProfit)), 1) / 1000) * 1000, 1000)
  const chartMinimum = Math.min(Math.floor(Math.min(...revenueSeries.map((item) => item.grossProfit), 0) / 1000) * 1000, 0)
  const chartRange = Math.max(chartMaximum - chartMinimum, 1)
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const groupWidth = plotWidth / Math.max(revenueSeries.length, 1)
  const barWidth = Math.min(28, groupWidth * 0.24)
  const ticks = Array.from({ length: 5 }, (_, index) => chartMinimum + (chartRange / 4) * index)
  const chartY = (value: number) => chartPadding.top + ((chartMaximum - value) / chartRange) * plotHeight
  const zeroY = chartY(0)
  const totalUnits = report.bestSellingProducts.reduce((sum, item) => sum + item.sold, 0)

  const exportCsv = () => {
    if (!data) return
    const rows: Array<Array<string | number>> = [
      ['BÁO CÁO KINH DOANH RUBEANORA'],
      ['Kỳ báo cáo', periodLabel],
      [],
      ['Chỉ số', 'Kỳ hiện tại', 'Kỳ trước', 'Thay đổi (%)'],
      ...comparisonRows.map((item) => [item.label, item.current, item.previous, item.change]),
      [],
      ['Mốc thời gian', 'Doanh thu thuần', 'Lãi / lỗ gộp'],
      ...revenueSeries.map((item) => [item.label, item.netRevenue, item.grossProfit]),
      [],
      ['Trạng thái đơn hàng', 'Số lượng', 'Tỷ lệ (%)'],
      ...statusRows.map((item) => [item.label, item.count, item.share]),
      [],
      ['Sản phẩm bán chạy', 'Số lượng bán'],
      ...report.bestSellingProducts.map((item) => [item.name, item.sold]),
      [],
      ['Cảnh báo tồn kho', 'Mã sản phẩm', 'SKU', 'Tồn kho', 'Tồn tối thiểu'],
      ...(data.lowStock || []).map((item) => [item.name, item.productCode, item.sku, item.stock, item.minimumStock]),
    ]
    const blob = new Blob([`\uFEFF${rows.map((row) => row.map(escapeCsv).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bao-cao-rubeanora-${period}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setExported(true)
    window.setTimeout(() => setExported(false), 1800)
  }

  const printedAt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())

  return (
    <AdminLayout activeItem="reports" searchPlaceholder="Tìm trong báo cáo...">
      <header className="admin-report-print-header">
        <div>
          <img src={storeSettings.logo || '/images/logo1.png'} alt={storeSettings.storeName} />
          <div><strong>{storeSettings.storeName}</strong><span>BÁO CÁO KINH DOANH</span></div>
        </div>
        <p><b>{periodLabel}</b><span>Thời điểm in: {printedAt}</span></p>
      </header>

      <div className="admin-page-heading admin-reports-heading">
        <div>
          <p>BÁO CÁO &amp; PHÂN TÍCH</p>
          <h1>Báo cáo kinh doanh</h1>
          <span>Số liệu thật được tổng hợp từ đơn hàng, khách hàng và tồn kho.</span>
        </div>
        <div className="admin-reports-actions">
          <label className="admin-date-filter">
            <span>Thời gian</span>
            <select value={period} onChange={(event) => setPeriod(event.target.value as ReportPeriod)}>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
              <option value="quarter">Theo quý</option>
              <option value="year">Theo năm</option>
            </select>
          </label>
          <button type="button" className="admin-report-export" onClick={exportCsv} disabled={!data || loading}>
            <AdminIcon name="download" />
            {exported ? 'Đã xuất báo cáo' : 'Xuất CSV'}
          </button>
          <button type="button" className="admin-report-print" onClick={() => window.print()} disabled={!data || loading}>
            <AdminIcon name="print" />
            In báo cáo
          </button>
        </div>
      </div>

      {loading ? <section className="admin-panel admin-report-state"><span className="admin-report-spinner" /><strong>Đang tổng hợp báo cáo...</strong></section> : null}
      {!loading && error ? <section className="admin-panel admin-report-state is-error"><AdminIcon name="report" /><strong>Không thể tải báo cáo</strong><p>{error}</p></section> : null}

      {!loading && data ? (
        <>
          <section className="admin-panel admin-report-comparison-panel" aria-label="So sánh hiệu quả kinh doanh">
            <div className="admin-panel-header">
              <div>
                <h2>So sánh hiệu quả kinh doanh</h2>
                <p>{periodLabel} {comparison}</p>
              </div>
              <span className="admin-panel-period">Phân tích biến động</span>
            </div>
            <div className="admin-report-comparison-table" role="table" aria-label="Bảng so sánh kỳ báo cáo">
              <div className="admin-report-comparison-head" role="row">
                <span role="columnheader">Chỉ số</span>
                <span role="columnheader">Kỳ hiện tại</span>
                <span role="columnheader">Kỳ trước</span>
                <span role="columnheader">Biến động</span>
              </div>
              {comparisonRows.map((item) => (
                <div className="admin-report-comparison-row" role="row" key={item.label}>
                  <div className="admin-report-comparison-label" role="cell">
                    <span className={`admin-stat-icon admin-stat-icon-${item.tone}`}><AdminIcon name={item.icon} /></span>
                    <strong>{item.label}</strong>
                  </div>
                  <strong role="cell">{item.current}</strong>
                  <span role="cell">{item.previous}</span>
                  <span role="cell" className={`admin-report-change${item.change === 0 ? ' is-neutral' : ''}${item.change < 0 ? ' is-decrease' : ''}${item.inverseTrend ? item.change > 0 ? ' is-unfavorable' : '' : item.change < 0 ? ' is-unfavorable' : ''}`}>
                    <AdminIcon name="arrowUp" />{Math.abs(item.change).toLocaleString('vi-VN')}{item.changeSuffix ?? '%'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-reports-main-grid">
            <article className="admin-panel admin-report-chart-panel">
              <div className="admin-panel-header">
                <div><h2>Doanh thu và lãi gộp</h2><p>{periodLabel} · Chỉ tính đơn đã giao</p></div>
                <div className="admin-report-legend"><span><i className="is-revenue" />Doanh thu thuần</span><span><i className="is-profit" />Lãi / lỗ gộp</span></div>
              </div>
              <div className="admin-report-chart" role="img" aria-label={`Biểu đồ doanh thu thuần và lãi gộp ${periodLabel.toLowerCase()}`}>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                  {ticks.map((tick) => {
                    const y = chartY(tick)
                    return (
                      <g key={tick}>
                        <line x1={chartPadding.left} y1={y} x2={chartWidth - chartPadding.right} y2={y} className="admin-report-gridline" />
                        <text x={chartPadding.left - 12} y={y + 4} textAnchor="end" className="admin-report-axis-label">{formatMoney(tick)}</text>
                      </g>
                    )
                  })}
                  {revenueSeries.map((item, index) => {
                    const centerX = chartPadding.left + groupWidth * index + groupWidth / 2
                    const revenueY = chartY(item.netRevenue)
                    const profitY = chartY(item.grossProfit)
                    return (
                      <g key={item.bucket} className="admin-report-bar-group">
                        <rect x={centerX - barWidth - 2} y={Math.min(revenueY, zeroY)} width={barWidth} height={Math.abs(zeroY - revenueY)} rx="4" className="admin-report-bar is-revenue">
                          <title>{`${item.label} · Doanh thu thuần: ${formatMoney(item.netRevenue)}`}</title>
                        </rect>
                        <rect x={centerX + 2} y={Math.min(profitY, zeroY)} width={barWidth} height={Math.abs(zeroY - profitY)} rx="4" className={`admin-report-bar is-profit${item.grossProfit < 0 ? ' is-loss' : ''}`}>
                          <title>{`${item.label} · ${formatProfit(item.grossProfit)}`}</title>
                        </rect>
                        <text x={centerX} y={chartPadding.top + plotHeight + 28} textAnchor="middle" className="admin-report-axis-label is-period">{item.label}</text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </article>

            <article className="admin-panel admin-report-category-panel">
              <div className="admin-panel-header"><div><h2>Cơ cấu đơn hàng</h2><p>Theo trạng thái · {periodLabel}</p></div></div>
              <div className="admin-report-categories">
                {statusRows.map((item) => (
                  <div className="admin-report-category" key={item.key}>
                    <div><span><i style={{ background: item.color }} />{item.label}</span><strong>{item.count.toLocaleString('vi-VN')} đơn</strong></div>
                    <div className="admin-report-progress"><span style={{ width: `${item.share}%`, background: item.color }} /></div>
                    <small>{item.share.toLocaleString('vi-VN')}% tổng đơn</small>
                  </div>
                ))}
                {report.orderStatus.total === 0 ? <p className="admin-report-inline-empty">Chưa có đơn hàng trong kỳ này.</p> : null}
              </div>
            </article>
          </section>

          <section className="admin-panel admin-report-products-panel">
            <div className="admin-panel-header"><div><h2>Sản phẩm bán chạy</h2><p>Xếp hạng theo số lượng đã bán trong {periodLabel.toLowerCase()}</p></div></div>
            <div className="admin-report-table-wrap">
              <table className="admin-report-table admin-report-products-table">
                <thead><tr><th>Xếp hạng</th><th>Sản phẩm</th><th>Đã bán</th><th>Tỷ trọng</th></tr></thead>
                <tbody>
                  {report.bestSellingProducts.map((product, index) => {
                    const contribution = totalUnits > 0 ? Math.round((product.sold / totalUnits) * 1000) / 10 : 0
                    return (
                      <tr key={product.id || `${product.name}-${index}`}>
                        <td><span className={`admin-report-rank is-${index + 1}`}>{index + 1}</span></td>
                        <td><div className="admin-report-product-cell"><span className="admin-report-product-avatar">{product.name.trim().charAt(0).toUpperCase()}</span><strong>{product.name}</strong></div></td>
                        <td>{product.sold.toLocaleString('vi-VN')} sản phẩm</td>
                        <td>{contribution.toLocaleString('vi-VN')}%</td>
                      </tr>
                    )
                  })}
                  {report.bestSellingProducts.length === 0 ? <tr><td colSpan={4} className="admin-report-table-empty">Chưa có sản phẩm đã giao trong kỳ này.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-panel admin-report-stock-panel">
            <div className="admin-panel-header"><div><h2>Cảnh báo tồn kho</h2><p>Sản phẩm có tồn kho bằng hoặc thấp hơn ngưỡng tối thiểu</p></div><span className="admin-panel-period">{data.lowStock.length} sản phẩm</span></div>
            <div className="admin-report-table-wrap">
              <table className="admin-report-table">
                <thead><tr><th>Sản phẩm</th><th>Mã sản phẩm</th><th>SKU</th><th>Tồn kho</th><th>Ngưỡng tối thiểu</th></tr></thead>
                <tbody>
                  {data.lowStock.map((item) => (
                    <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.productCode || '—'}</td><td>{item.sku || '—'}</td><td><span className="admin-report-stock-value">{item.stock}</span></td><td>{item.minimumStock}</td></tr>
                  ))}
                  {data.lowStock.length === 0 ? <tr><td colSpan={5} className="admin-report-table-empty">Tồn kho đang ở mức an toàn.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </AdminLayout>
  )
}

export default AdminReportsPage
