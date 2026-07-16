import { useMemo, useState } from 'react'
import AdminLayout, { AdminIcon, type AdminIconName } from '../../components/AdminLayout'
import { products } from '../../data/products'
import { useStoreSettings } from '../../utils/storeSettings'
import './AdminReportsPage.css'

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year'

interface TrendItem {
  label: string
  revenue: number
  profit: number
  orders: number
}

interface ReportDataset {
  label: string
  comparison: string
  revenue: number
  profit: number
  orders: number
  averageOrder: number
  changes: [number, number, number, number]
  trend: TrendItem[]
  productSales: number[]
}

const reportDatasets: Record<ReportPeriod, ReportDataset> = {
  week: {
    label: '7 ngày gần đây',
    comparison: 'so với 7 ngày trước',
    revenue: 32_400_000,
    profit: 12_100_000,
    orders: 112,
    averageOrder: 289_286,
    changes: [6.8, 7.2, 5.4, 1.3],
    trend: [
      { label: 'T2', revenue: 3.2, profit: 1.2, orders: 12 },
      { label: 'T3', revenue: 4.6, profit: 1.7, orders: 15 },
      { label: 'T4', revenue: 4.1, profit: 1.5, orders: 14 },
      { label: 'T5', revenue: 5.2, profit: 2, orders: 18 },
      { label: 'T6', revenue: 5.8, profit: 2.2, orders: 20 },
      { label: 'T7', revenue: 5.1, profit: 1.9, orders: 18 },
      { label: 'CN', revenue: 4.4, profit: 1.6, orders: 15 },
    ],
    productSales: [24, 26, 20, 18, 10],
  },
  month: {
    label: 'Tháng 7/2026',
    comparison: 'so với tháng trước',
    revenue: 128_650_000,
    profit: 48_700_000,
    orders: 486,
    averageOrder: 264_712,
    changes: [12.5, 10.8, 8.2, 4.1],
    trend: [
      { label: 'Tuần 1', revenue: 22.5, profit: 8.5, orders: 84 },
      { label: 'Tuần 2', revenue: 28.7, profit: 10.8, orders: 106 },
      { label: 'Tuần 3', revenue: 31.2, profit: 11.8, orders: 118 },
      { label: 'Tuần 4', revenue: 34.8, profit: 13.2, orders: 132 },
      { label: 'Tuần 5', revenue: 11.45, profit: 4.4, orders: 46 },
    ],
    productSales: [100, 110, 80, 70, 40],
  },
  quarter: {
    label: 'Quý 3/2026',
    comparison: 'so với quý trước',
    revenue: 356_800_000,
    profit: 134_900_000,
    orders: 1_284,
    averageOrder: 277_882,
    changes: [10.7, 9.6, 9.5, 2.2],
    trend: [
      { label: 'Tháng 7', revenue: 128.65, profit: 48.7, orders: 486 },
      { label: 'Tháng 8', revenue: 116.2, profit: 44.2, orders: 421 },
      { label: 'Tháng 9', revenue: 111.95, profit: 42, orders: 377 },
    ],
    productSales: [260, 300, 220, 200, 120],
  },
  year: {
    label: 'Năm 2026',
    comparison: 'so với năm 2025',
    revenue: 1_240_000_000,
    profit: 468_200_000,
    orders: 5_620,
    averageOrder: 220_641,
    changes: [18.4, 16.7, 14.1, 3.8],
    trend: [
      { label: 'Quý 1', revenue: 245.2, profit: 91.5, orders: 1_126 },
      { label: 'Quý 2', revenue: 318.6, profit: 120.3, orders: 1_438 },
      { label: 'Quý 3', revenue: 356.8, profit: 134.9, orders: 1_284 },
      { label: 'Quý 4', revenue: 319.4, profit: 121.5, orders: 1_772 },
    ],
    productSales: [900, 1100, 850, 800, 400],
  },
}

const categoryShares = [
  { label: 'Combo chăm sóc da', share: 36, color: '#b53740' },
  { label: 'Sữa rửa mặt', share: 24, color: '#d66a72' },
  { label: 'Mặt nạ', share: 20, color: '#3f8d70' },
  { label: 'Toner', share: 16, color: '#4f84bd' },
  { label: 'Sản phẩm khác', share: 4, color: '#c0b4b5' },
]

const topProductIds = ['1', '2', '3', '4', '5']

const formatMoney = (value: number) => `${value.toLocaleString('vi-VN')}đ`

const chartWidth = 860
const chartHeight = 300
const chartPadding = { top: 34, right: 24, bottom: 52, left: 62 }

function AdminReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [exported, setExported] = useState(false)
  const storeSettings = useStoreSettings()
  const dataset = reportDatasets[period]
  const printedAt = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date())

  const metrics: Array<{
    label: string
    value: string
    change: number
    icon: AdminIconName
    tone: string
  }> = [
    { label: 'Doanh thu thuần', value: formatMoney(dataset.revenue), change: dataset.changes[0], icon: 'revenue', tone: 'red' },
    { label: 'Lợi nhuận gộp', value: formatMoney(dataset.profit), change: dataset.changes[1], icon: 'report', tone: 'green' },
    { label: 'Đơn hàng thành công', value: dataset.orders.toLocaleString('vi-VN'), change: dataset.changes[2], icon: 'orders', tone: 'blue' },
    { label: 'Giá trị đơn trung bình', value: formatMoney(dataset.averageOrder), change: dataset.changes[3], icon: 'cart', tone: 'orange' },
  ]

  const topProducts = useMemo(
    () =>
      topProductIds.map((id, index) => {
        const product = products.find((item) => item.id === id) ?? products[index]
        const sold = dataset.productSales[index]
        return {
          ...product,
          sold,
          revenue: sold * product.price,
          contribution: Math.round(((sold * product.price) / dataset.revenue) * 1000) / 10,
        }
      }),
    [dataset],
  )

  const maxChartValue = Math.ceil(Math.max(...dataset.trend.map((item) => item.revenue)) / 10) * 10 || 10
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const groupWidth = plotWidth / dataset.trend.length
  const barWidth = Math.min(34, groupWidth * 0.27)
  const ticks = Array.from({ length: 5 }, (_, index) => (maxChartValue / 4) * index)

  const exportCsv = () => {
    const rows = [
      ['Kỳ', 'Doanh thu', 'Lợi nhuận gộp', 'Đơn hàng'],
      ...dataset.trend.map((item) => [item.label, item.revenue * 1_000_000, item.profit * 1_000_000, item.orders]),
      [],
      ['Sản phẩm', 'Số lượng bán', 'Doanh thu'],
      ...topProducts.map((product) => [product.name, product.sold, product.revenue]),
    ]
    const csv = rows
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bao-cao-kinh-doanh-${period}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setExported(true)
    window.setTimeout(() => setExported(false), 1800)
  }

  return (
    <AdminLayout activeItem="reports" searchPlaceholder="Tìm trong báo cáo...">
      <header className="admin-report-print-header">
        <div>
          <img src={storeSettings.logo || '/images/logo1.png'} alt={storeSettings.storeName} />
          <div>
            <strong>{storeSettings.storeName}</strong>
            <span>BÁO CÁO KINH DOANH</span>
          </div>
        </div>
        <p><b>{dataset.label}</b><span>Thời điểm in: {printedAt}</span></p>
      </header>

      <div className="admin-page-heading admin-reports-heading">
        <div>
          <p>BÁO CÁO &amp; PHÂN TÍCH</p>
          <h1>Báo cáo kinh doanh</h1>
          <span>Theo dõi hiệu quả bán hàng, lợi nhuận và sản phẩm nổi bật.</span>
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
          <button type="button" className="admin-report-export" onClick={exportCsv}>
            <AdminIcon name="download" />
            {exported ? 'Đã xuất báo cáo' : 'Xuất CSV'}
          </button>
          <button type="button" className="admin-report-print" onClick={() => window.print()}>
            <AdminIcon name="print" />
            In báo cáo
          </button>
        </div>
      </div>

      <section className="admin-report-metrics" aria-label="Chỉ số báo cáo">
        {metrics.map((metric) => (
          <article className="admin-report-metric" key={metric.label}>
            <div className={`admin-stat-icon admin-stat-icon-${metric.tone}`}>
              <AdminIcon name={metric.icon} />
            </div>
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p><b><AdminIcon name="arrowUp" />{metric.change}%</b> {dataset.comparison}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-reports-main-grid">
        <article className="admin-panel admin-report-chart-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Doanh thu và lợi nhuận</h2>
              <p>{dataset.label} · Đơn vị: triệu đồng</p>
            </div>
            <div className="admin-report-legend" aria-label="Chú thích biểu đồ">
              <span><i className="is-revenue" />Doanh thu</span>
              <span><i className="is-profit" />Lợi nhuận</span>
            </div>
          </div>
          <div className="admin-report-chart" role="img" aria-label={`Biểu đồ doanh thu và lợi nhuận ${dataset.label.toLowerCase()}`}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {ticks.map((tick) => {
                const y = chartPadding.top + plotHeight - (tick / maxChartValue) * plotHeight
                return (
                  <g key={tick}>
                    <line x1={chartPadding.left} y1={y} x2={chartWidth - chartPadding.right} y2={y} className="admin-report-gridline" />
                    <text x={chartPadding.left - 12} y={y + 4} textAnchor="end" className="admin-report-axis-label">
                      {Number.isInteger(tick) ? tick : tick.toFixed(1)}tr
                    </text>
                  </g>
                )
              })}
              {dataset.trend.map((item, index) => {
                const centerX = chartPadding.left + groupWidth * index + groupWidth / 2
                const revenueHeight = (item.revenue / maxChartValue) * plotHeight
                const profitHeight = (item.profit / maxChartValue) * plotHeight
                return (
                  <g key={item.label} className="admin-report-bar-group">
                    <rect
                      x={centerX - barWidth - 3}
                      y={chartPadding.top + plotHeight - revenueHeight}
                      width={barWidth}
                      height={revenueHeight}
                      rx="5"
                      className="admin-report-bar is-revenue"
                    >
                      <title>{`${item.label}: ${item.revenue.toLocaleString('vi-VN')} triệu đồng doanh thu`}</title>
                    </rect>
                    <rect
                      x={centerX + 3}
                      y={chartPadding.top + plotHeight - profitHeight}
                      width={barWidth}
                      height={profitHeight}
                      rx="5"
                      className="admin-report-bar is-profit"
                    >
                      <title>{`${item.label}: ${item.profit.toLocaleString('vi-VN')} triệu đồng lợi nhuận`}</title>
                    </rect>
                    <text x={centerX} y={chartPadding.top + plotHeight + 28} textAnchor="middle" className="admin-report-axis-label is-period">
                      {item.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </article>

        <article className="admin-panel admin-report-category-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Cơ cấu doanh thu</h2>
              <p>Theo danh mục · {dataset.label}</p>
            </div>
          </div>
          <div className="admin-report-categories">
            {categoryShares.map((category) => (
              <div className="admin-report-category" key={category.label}>
                <div>
                  <span><i style={{ background: category.color }} />{category.label}</span>
                  <strong>{formatMoney((dataset.revenue * category.share) / 100)}</strong>
                </div>
                <div className="admin-report-progress">
                  <span style={{ width: `${category.share}%`, background: category.color }} />
                </div>
                <small>{category.share}% tổng doanh thu</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-panel admin-report-period-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Hiệu quả theo kỳ</h2>
            <p>Đối chiếu chi tiết doanh thu, lợi nhuận và số đơn</p>
          </div>
          <span className="admin-panel-period">{dataset.label}</span>
        </div>
        <div className="admin-report-table-wrap">
          <table className="admin-report-table">
            <thead>
              <tr>
                <th>Kỳ báo cáo</th>
                <th>Doanh thu</th>
                <th>Lợi nhuận gộp</th>
                <th>Biên lợi nhuận</th>
                <th>Đơn hàng</th>
                <th>Giá trị trung bình</th>
              </tr>
            </thead>
            <tbody>
              {dataset.trend.map((item) => (
                <tr key={item.label}>
                  <td><strong>{item.label}</strong></td>
                  <td>{formatMoney(item.revenue * 1_000_000)}</td>
                  <td>{formatMoney(item.profit * 1_000_000)}</td>
                  <td><span className="admin-report-margin">{((item.profit / item.revenue) * 100).toFixed(1).replace('.', ',')}%</span></td>
                  <td>{item.orders.toLocaleString('vi-VN')}</td>
                  <td>{formatMoney(Math.round((item.revenue * 1_000_000) / item.orders))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel admin-report-products-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Sản phẩm đóng góp doanh thu cao</h2>
            <p>Top 5 sản phẩm theo doanh thu trong {dataset.label.toLowerCase()}</p>
          </div>
        </div>
        <div className="admin-report-table-wrap">
          <table className="admin-report-table admin-report-products-table">
            <thead>
              <tr>
                <th>Xếp hạng</th>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Đã bán</th>
                <th>Doanh thu</th>
                <th>Đóng góp</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.id}>
                  <td><span className={`admin-report-rank is-${index + 1}`}>{index + 1}</span></td>
                  <td>
                    <div className="admin-report-product-cell">
                      <img src={product.image} alt="" />
                      <strong>{product.name}</strong>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>{product.sold.toLocaleString('vi-VN')}</td>
                  <td>{formatMoney(product.revenue)}</td>
                  <td>{product.contribution.toLocaleString('vi-VN')}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}

export default AdminReportsPage
