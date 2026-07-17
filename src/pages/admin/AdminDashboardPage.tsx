import { useEffect, useState } from 'react'
import AdminLayout, { AdminIcon, type AdminIconName } from '../../components/AdminLayout'
import { api } from '../../services/api'
import './AdminDashboardPage.css'

type RevenuePeriod = 'week' | 'month' | 'quarter' | 'year'

interface DashboardStat {
  label: string
  value: string
  change: string
  note: string
  icon: AdminIconName
  tone: string
}

const dashboardPeriodMeta: Record<RevenuePeriod, { label: string; comparison: string }> = {
  week: { label: '7 ngày gần đây', comparison: 'so với tuần trước' },
  month: { label: 'Tháng 7/2026', comparison: 'so với tháng trước' },
  quarter: { label: 'Quý 3/2026', comparison: 'so với quý trước' },
  year: { label: 'Năm 2026', comparison: 'so với năm 2025' },
}

const statsByPeriod: Record<RevenuePeriod, DashboardStat[]> = {
  week: [
    { label: 'Tổng doanh thu', value: '32.400.000đ', change: '6,8%', note: dashboardPeriodMeta.week.comparison, icon: 'revenue', tone: 'red' },
    { label: 'Tổng đơn hàng', value: '112', change: '5,4%', note: dashboardPeriodMeta.week.comparison, icon: 'cart', tone: 'blue' },
    { label: 'Khách hàng mới', value: '86', change: '9,1%', note: dashboardPeriodMeta.week.comparison, icon: 'userPlus', tone: 'green' },
    { label: 'Sản phẩm đã bán', value: '348', change: '7,2%', note: dashboardPeriodMeta.week.comparison, icon: 'box', tone: 'orange' },
  ],
  month: [
    { label: 'Tổng doanh thu', value: '128.650.000đ', change: '12,5%', note: dashboardPeriodMeta.month.comparison, icon: 'revenue', tone: 'red' },
    { label: 'Tổng đơn hàng', value: '486', change: '8,2%', note: dashboardPeriodMeta.month.comparison, icon: 'cart', tone: 'blue' },
    { label: 'Khách hàng mới', value: '1.248', change: '15,3%', note: dashboardPeriodMeta.month.comparison, icon: 'userPlus', tone: 'green' },
    { label: 'Sản phẩm đã bán', value: '1.576', change: '6,4%', note: dashboardPeriodMeta.month.comparison, icon: 'box', tone: 'orange' },
  ],
  quarter: [
    { label: 'Tổng doanh thu', value: '356.800.000đ', change: '10,7%', note: dashboardPeriodMeta.quarter.comparison, icon: 'revenue', tone: 'red' },
    { label: 'Tổng đơn hàng', value: '1.284', change: '9,5%', note: dashboardPeriodMeta.quarter.comparison, icon: 'cart', tone: 'blue' },
    { label: 'Khách hàng mới', value: '2.746', change: '11,8%', note: dashboardPeriodMeta.quarter.comparison, icon: 'userPlus', tone: 'green' },
    { label: 'Sản phẩm đã bán', value: '4.124', change: '8,6%', note: dashboardPeriodMeta.quarter.comparison, icon: 'box', tone: 'orange' },
  ],
  year: [
    { label: 'Tổng doanh thu', value: '1.240.000.000đ', change: '18,4%', note: dashboardPeriodMeta.year.comparison, icon: 'revenue', tone: 'red' },
    { label: 'Tổng đơn hàng', value: '5.620', change: '14,1%', note: dashboardPeriodMeta.year.comparison, icon: 'cart', tone: 'blue' },
    { label: 'Khách hàng mới', value: '9.438', change: '20,6%', note: dashboardPeriodMeta.year.comparison, icon: 'userPlus', tone: 'green' },
    { label: 'Sản phẩm đã bán', value: '18.756', change: '16,2%', note: dashboardPeriodMeta.year.comparison, icon: 'box', tone: 'orange' },
  ],
}

const orderStatusByPeriod: Record<RevenuePeriod, { total: number; completed: number; processing: number; pending: number; cancelled: number }> = {
  week: { total: 112, completed: 55, processing: 24, pending: 13, cancelled: 8 },
  month: { total: 486, completed: 62, processing: 18, pending: 12, cancelled: 8 },
  quarter: { total: 1284, completed: 67, processing: 17, pending: 10, cancelled: 6 },
  year: { total: 5620, completed: 70, processing: 16, pending: 8, cancelled: 6 },
}

interface RevenueChartData {
  title: string
  description: string
  ariaLabel: string
  maxValue: number
  items: Array<{ label: string; detail: string; value: number }>
}

const revenueDatasets: Record<RevenuePeriod, RevenueChartData> = {
  week: {
    title: 'Doanh thu theo tuần',
    description: '7 ngày gần đây · Đơn vị: triệu đồng',
    ariaLabel: 'Biểu đồ doanh thu từng ngày trong tuần gần đây',
    maxValue: 8,
    items: [
      { label: 'T2', detail: 'Thứ Hai', value: 2.8 },
      { label: 'T3', detail: 'Thứ Ba', value: 3.6 },
      { label: 'T4', detail: 'Thứ Tư', value: 3.2 },
      { label: 'T5', detail: 'Thứ Năm', value: 4.7 },
      { label: 'T6', detail: 'Thứ Sáu', value: 5.4 },
      { label: 'T7', detail: 'Thứ Bảy', value: 6.8 },
      { label: 'CN', detail: 'Chủ Nhật', value: 5.9 },
    ],
  },
  month: {
    title: 'Doanh thu theo tháng',
    description: 'Tháng 7/2026 · Đơn vị: triệu đồng',
    ariaLabel: 'Biểu đồ doanh thu theo các tuần trong tháng 7 năm 2026',
    maxValue: 40,
    items: [
      { label: 'Tuần 1', detail: 'Tuần 1 tháng 7', value: 22.5 },
      { label: 'Tuần 2', detail: 'Tuần 2 tháng 7', value: 28.7 },
      { label: 'Tuần 3', detail: 'Tuần 3 tháng 7', value: 31.2 },
      { label: 'Tuần 4', detail: 'Tuần 4 tháng 7', value: 34.8 },
      { label: 'Tuần 5', detail: 'Tuần 5 tháng 7', value: 11.45 },
    ],
  },
  quarter: {
    title: 'Doanh thu theo quý',
    description: 'Quý 3/2026 · Đơn vị: triệu đồng',
    ariaLabel: 'Biểu đồ doanh thu theo ba tháng trong quý 3 năm 2026',
    maxValue: 160,
    items: [
      { label: 'Tháng 7', detail: 'Tháng 7/2026', value: 128.65 },
      { label: 'Tháng 8', detail: 'Tháng 8/2026', value: 116.2 },
      { label: 'Tháng 9', detail: 'Tháng 9/2026', value: 111.95 },
    ],
  },
  year: {
    title: 'Doanh thu theo năm',
    description: 'Năm 2026 · Đơn vị: triệu đồng',
    ariaLabel: 'Biểu đồ doanh thu theo bốn quý trong năm 2026',
    maxValue: 400,
    items: [
      { label: 'Quý 1', detail: 'Quý 1/2026', value: 245.2 },
      { label: 'Quý 2', detail: 'Quý 2/2026', value: 318.6 },
      { label: 'Quý 3', detail: 'Quý 3/2026', value: 356.8 },
      { label: 'Quý 4', detail: 'Quý 4/2026', value: 319.4 },
    ],
  },
}

const fallbackRecentOrders = [
  { code: 'RBB-26071301', customer: 'Nguyễn Minh Anh', initials: 'MA', date: '13/07/2026, 14:35', total: '780.000đ', status: 'Chờ xác nhận', statusKey: 'pending' },
  { code: 'RBB-26071302', customer: 'Trần Quang Huy', initials: 'QH', date: '13/07/2026, 13:10', total: '450.000đ', status: 'Đã xác nhận', statusKey: 'confirmed' },
  { code: 'RBB-26071303', customer: 'Lê Thu Trang', initials: 'TT', date: '13/07/2026, 11:42', total: '690.000đ', status: 'Đang giao hàng', statusKey: 'shipping' },
  { code: 'RBB-26071204', customer: 'Phạm Quốc Bảo', initials: 'QB', date: '12/07/2026, 20:18', total: '250.000đ', status: 'Đã giao hàng', statusKey: 'completed' },
  { code: 'RBB-26071205', customer: 'Vũ Ngọc Hà', initials: 'NH', date: '12/07/2026, 18:06', total: '520.000đ', status: 'Đã hủy', statusKey: 'cancelled' },
]

const bestSellingProductBase = [
  { name: 'Sữa rửa mặt tạo bọt đậu đỏ', shortName: 'Sữa rửa mặt', tone: 'red' },
  { name: 'Mặt nạ tẩy tế bào chết đậu đỏ', shortName: 'Mặt nạ', tone: 'green' },
  { name: 'Toner dưỡng da đậu đỏ', shortName: 'Toner', tone: 'blue' },
  { name: 'Combo chăm sóc da 3 bước', shortName: 'Combo 3 bước', tone: 'orange' },
  { name: 'Bột đậu đỏ nguyên chất', shortName: 'Bột đậu đỏ', tone: 'purple' },
]

const productSalesByPeriod: Record<RevenuePeriod, { maxValue: number; values: number[] }> = {
  week: { maxValue: 100, values: [82, 71, 64, 52, 41] },
  month: { maxValue: 400, values: [342, 286, 254, 198, 156] },
  quarter: { maxValue: 1000, values: [864, 742, 689, 536, 418] },
  year: { maxValue: 4000, values: [3420, 2986, 2654, 2198, 1756] },
}

const productChartWidth = 900
const productChartHeight = 285
const productChartPadding = { top: 35, right: 25, bottom: 55, left: 52 }
const productPlotWidth = productChartWidth - productChartPadding.left - productChartPadding.right
const productPlotHeight = productChartHeight - productChartPadding.top - productChartPadding.bottom
const productBarBand = productPlotWidth / bestSellingProductBase.length
const productBarWidth = 76

const chartWidth = 700
const chartHeight = 230
const chartPadding = { top: 18, right: 18, bottom: 38, left: 46 }
const plotWidth = chartWidth - chartPadding.left - chartPadding.right
const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<{
    summary: Record<string, number>
    recentOrders: Array<Record<string, unknown>>
  } | null>(null)
  const [dashboardPeriod, setDashboardPeriod] = useState<RevenuePeriod>('month')
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState<number | null>(null)
  const periodMeta = dashboardPeriodMeta[dashboardPeriod]
  useEffect(() => {
    api.get<{ summary: Record<string, number>; recentOrders: Array<Record<string, unknown>> }>('/admin/dashboard')
      .then(setDashboard)
      .catch(() => undefined)
  }, [])

  const stats = dashboard ? [
    { label: 'Tổng doanh thu', value: `${Number(dashboard.summary.monthly_revenue || 0).toLocaleString('vi-VN')}đ`, change: '', note: 'Tháng hiện tại', icon: 'revenue', tone: 'red' },
    { label: 'Tổng đơn hàng', value: String(dashboard.summary.total_orders || 0), change: '', note: 'Tất cả đơn', icon: 'cart', tone: 'blue' },
    { label: 'Khách hàng', value: String(dashboard.summary.customers || 0), change: '', note: 'Tài khoản khách hàng', icon: 'userPlus', tone: 'green' },
    { label: 'Sắp hết hàng', value: String(dashboard.summary.low_stock_products || 0), change: '', note: 'Cần nhập thêm', icon: 'box', tone: 'orange' },
  ] as DashboardStat[] : statsByPeriod[dashboardPeriod]
  const recentOrders = dashboard?.recentOrders.length ? dashboard.recentOrders.map((item) => ({
    code: String(item.orderCode || ''),
    initials: String(item.recipientName || 'KH').slice(0, 2).toLocaleUpperCase('vi-VN'),
    customer: String(item.customerName || item.recipientName || 'Khách hàng'),
    date: new Date(String(item.createdAt)).toLocaleString('vi-VN'),
    total: `${Number(item.total || 0).toLocaleString('vi-VN')}đ`,
    status: String(item.orderStatus || ''),
    statusKey: String(item.orderStatus || '').toLocaleLowerCase('vi-VN'),
  })) : fallbackRecentOrders
  const orderStatus = orderStatusByPeriod[dashboardPeriod]
  const completedOrderCount = Math.round((orderStatus.total * orderStatus.completed) / 100)
  const processingOrderCount = Math.round((orderStatus.total * orderStatus.processing) / 100)
  const pendingOrderCount = Math.round((orderStatus.total * orderStatus.pending) / 100)
  const cancelledOrderCount = orderStatus.total - completedOrderCount - processingOrderCount - pendingOrderCount
  const revenueChart = revenueDatasets[dashboardPeriod]
  const productSales = productSalesByPeriod[dashboardPeriod]
  const bestSellingProducts = bestSellingProductBase.map((product, index) => ({
    ...product,
    sold: productSales.values[index],
  }))
  const chartPoints = revenueChart.items.map((item, index) => {
    const x = chartPadding.left + (index * plotWidth) / (revenueChart.items.length - 1)
    const y = chartPadding.top + plotHeight - (item.value / revenueChart.maxValue) * plotHeight
    return { ...item, x, y }
  })
  const linePoints = chartPoints.map(({ x, y }) => `${x},${y}`).join(' ')
  const areaPoints = `${chartPadding.left},${chartPadding.top + plotHeight} ${linePoints} ${chartPadding.left + plotWidth},${chartPadding.top + plotHeight}`
  const chartTicks = Array.from({ length: 5 }, (_, index) => (revenueChart.maxValue / 4) * index)
  const productChartTicks = Array.from({ length: 5 }, (_, index) => (productSales.maxValue / 4) * index)
  const hoveredRevenuePoint = hoveredRevenueIndex === null ? null : chartPoints[hoveredRevenueIndex]
  const revenueTooltipWidth = 150
  const revenueTooltipHeight = 46
  const revenueTooltipX = hoveredRevenuePoint
    ? Math.min(
        Math.max(hoveredRevenuePoint.x - revenueTooltipWidth / 2, chartPadding.left),
        chartWidth - chartPadding.right - revenueTooltipWidth,
      )
    : 0
  const revenueTooltipY = hoveredRevenuePoint
    ? hoveredRevenuePoint.y - revenueTooltipHeight - 13 < chartPadding.top
      ? hoveredRevenuePoint.y + 13
      : hoveredRevenuePoint.y - revenueTooltipHeight - 13
    : 0

  return (
    <AdminLayout activeItem="dashboard">
          <div className="admin-page-heading">
            <div>
              <p>TỔNG QUAN KINH DOANH</p>
              <h1>Dashboard</h1>
              <span>Cập nhật tình hình kinh doanh Rubeanora hôm nay.</span>
            </div>
            <label className="admin-date-filter">
              <span>Lọc toàn bộ</span>
              <select
                value={dashboardPeriod}
                onChange={(event) => {
                  setDashboardPeriod(event.target.value as RevenuePeriod)
                  setHoveredRevenueIndex(null)
                }}
                aria-label="Lọc toàn bộ dashboard theo thời gian"
              >
                <option value="week">Theo tuần</option>
                <option value="month">Theo tháng</option>
                <option value="quarter">Theo quý</option>
                <option value="year">Theo năm</option>
              </select>
            </label>
          </div>

          <section className="admin-stats-grid" aria-label="Các chỉ số tổng quan">
            {stats.map((stat) => (
              <article className="admin-stat-card" key={stat.label}>
                <div className={`admin-stat-icon admin-stat-icon-${stat.tone}`}>
                  <AdminIcon name={stat.icon} />
                </div>
                <div className="admin-stat-content">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <p><b><AdminIcon name="arrowUp" />{stat.change}</b> {stat.note}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-charts-grid">
            <article className="admin-panel admin-revenue-panel">
              <div className="admin-panel-header">
                <div>
                  <h2>{revenueChart.title}</h2>
                  <p>{revenueChart.description}</p>
                </div>
                <span className="admin-panel-period">{periodMeta.label}</span>
              </div>

              <div className="admin-line-chart" role="img" aria-label={revenueChart.ariaLabel}>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                  {chartTicks.map((tick) => {
                    const y = chartPadding.top + plotHeight - (tick / revenueChart.maxValue) * plotHeight
                    return (
                      <g key={tick}>
                        <line x1={chartPadding.left} y1={y} x2={chartWidth - chartPadding.right} y2={y} className="admin-chart-gridline" />
                        <text x={chartPadding.left - 12} y={y + 4} textAnchor="end" className="admin-chart-label">{Number.isInteger(tick) ? tick : tick.toFixed(1)}</text>
                      </g>
                    )
                  })}
                  <polygon points={areaPoints} className="admin-chart-area" />
                  <polyline points={linePoints} className="admin-chart-line" />
                  {chartPoints.map((point, index) => (
                    <g
                      key={point.detail}
                      className={`admin-chart-point${hoveredRevenueIndex === index ? ' is-active' : ''}`}
                      tabIndex={0}
                      role="button"
                      aria-label={`${point.detail}: ${point.value.toLocaleString('vi-VN')} triệu đồng`}
                      onMouseEnter={() => setHoveredRevenueIndex(index)}
                      onMouseMove={() => setHoveredRevenueIndex(index)}
                      onMouseLeave={() => setHoveredRevenueIndex(null)}
                      onFocus={() => setHoveredRevenueIndex(index)}
                      onBlur={() => setHoveredRevenueIndex(null)}
                    >
                      <circle cx={point.x} cy={point.y} r="14" className="admin-chart-hit-area" />
                      <circle cx={point.x} cy={point.y} r="5" />
                      <text x={point.x} y={chartPadding.top + plotHeight + 26} textAnchor="middle" className="admin-chart-label">{point.label}</text>
                      <title>{`${point.detail}: ${point.value.toString().replace('.', ',')} triệu đồng`}</title>
                    </g>
                  ))}
                  {hoveredRevenuePoint && (
                    <g className="admin-chart-tooltip" pointerEvents="none">
                      <rect x={revenueTooltipX} y={revenueTooltipY} width={revenueTooltipWidth} height={revenueTooltipHeight} rx="6" />
                      <text x={revenueTooltipX + 11} y={revenueTooltipY + 17} className="admin-chart-tooltip-label">
                        {hoveredRevenuePoint.detail}
                      </text>
                      <text x={revenueTooltipX + 11} y={revenueTooltipY + 35} className="admin-chart-tooltip-value">
                        {hoveredRevenuePoint.value.toLocaleString('vi-VN')} triệu đồng
                      </text>
                    </g>
                  )}
                </svg>
              </div>
            </article>

            <article className="admin-panel admin-order-status-panel">
              <div className="admin-panel-header">
                <div>
                  <h2>Trạng thái đơn hàng</h2>
                  <p>{periodMeta.label}</p>
                </div>
                <button type="button" className="admin-icon-button" aria-label="Tùy chọn biểu đồ">
                  <AdminIcon name="more" />
                </button>
              </div>
              <div className="admin-donut-wrap">
                <div className="admin-donut-chart">
                  <svg viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r="48" className="admin-donut-track" />
                    <circle cx="60" cy="60" r="48" pathLength="100" strokeDasharray={`${orderStatus.completed} ${100 - orderStatus.completed}`} strokeDashoffset="0" className="admin-donut-segment admin-donut-completed" />
                    <circle cx="60" cy="60" r="48" pathLength="100" strokeDasharray={`${orderStatus.processing} ${100 - orderStatus.processing}`} strokeDashoffset={-orderStatus.completed} className="admin-donut-segment admin-donut-processing" />
                    <circle cx="60" cy="60" r="48" pathLength="100" strokeDasharray={`${orderStatus.pending} ${100 - orderStatus.pending}`} strokeDashoffset={-(orderStatus.completed + orderStatus.processing)} className="admin-donut-segment admin-donut-pending" />
                    <circle cx="60" cy="60" r="48" pathLength="100" strokeDasharray={`${orderStatus.cancelled} ${100 - orderStatus.cancelled}`} strokeDashoffset={-(orderStatus.completed + orderStatus.processing + orderStatus.pending)} className="admin-donut-segment admin-donut-cancelled" />
                  </svg>
                  <div><strong>{orderStatus.total.toLocaleString('vi-VN')}</strong><span>Đơn hàng</span></div>
                </div>
                <div className="admin-donut-legend">
                  <p><i className="completed" /><span>Đã giao</span><strong>{completedOrderCount.toLocaleString('vi-VN')} đơn</strong></p>
                  <p><i className="processing" /><span>Đang xử lý</span><strong>{processingOrderCount.toLocaleString('vi-VN')} đơn</strong></p>
                  <p><i className="pending" /><span>Chờ xác nhận</span><strong>{pendingOrderCount.toLocaleString('vi-VN')} đơn</strong></p>
                  <p><i className="cancelled" /><span>Đã hủy</span><strong>{cancelledOrderCount.toLocaleString('vi-VN')} đơn</strong></p>
                </div>
              </div>
            </article>
          </section>

          <section className="admin-panel admin-best-products-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Sản phẩm bán chạy</h2>
                <p>Top 5 sản phẩm theo số lượng đã bán</p>
              </div>
              <span className="admin-panel-period">{periodMeta.label}</span>
            </div>

            <div
              className="admin-best-products-chart"
              role="img"
              aria-label={`Biểu đồ cột năm sản phẩm bán chạy nhất trong ${periodMeta.label.toLowerCase()}`}
            >
              <svg viewBox={`0 0 ${productChartWidth} ${productChartHeight}`}>
                {productChartTicks.map((tick) => {
                  const y = productChartPadding.top + productPlotHeight - (tick / productSales.maxValue) * productPlotHeight
                  return (
                    <g key={tick}>
                      <line
                        x1={productChartPadding.left}
                        y1={y}
                        x2={productChartWidth - productChartPadding.right}
                        y2={y}
                        className="admin-product-chart-gridline"
                      />
                      <text x={productChartPadding.left - 13} y={y + 4} textAnchor="end" className="admin-product-chart-axis-label">
                        {tick}
                      </text>
                    </g>
                  )
                })}

                {bestSellingProducts.map((product, index) => {
                  const barHeight = (product.sold / productSales.maxValue) * productPlotHeight
                  const x = productChartPadding.left + productBarBand * index + (productBarBand - productBarWidth) / 2
                  const y = productChartPadding.top + productPlotHeight - barHeight
                  const centerX = x + productBarWidth / 2

                  return (
                    <g key={product.name} className="admin-product-chart-column">
                      <rect
                        x={x}
                        y={y}
                        width={productBarWidth}
                        height={barHeight}
                        rx="6"
                        className={`admin-product-chart-bar is-${product.tone}`}
                      />
                      <text x={centerX} y={y - 10} textAnchor="middle" className="admin-product-chart-value">
                        {product.sold}
                      </text>
                      <text
                        x={centerX}
                        y={productChartPadding.top + productPlotHeight + 28}
                        textAnchor="middle"
                        className="admin-product-chart-name"
                      >
                        {product.shortName}
                      </text>
                      <title>{`${product.name}: ${product.sold} sản phẩm đã bán`}</title>
                    </g>
                  )
                })}
              </svg>
            </div>
          </section>

          <section className="admin-panel admin-orders-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Đơn hàng gần đây</h2>
                <p>5 đơn hàng mới nhất · {periodMeta.label}</p>
              </div>
              <button type="button" className="admin-view-all">Xem tất cả đơn hàng <span>→</span></button>
            </div>

            <div className="admin-orders-table-wrap">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>Mã đơn hàng</th>
                    <th>Khách hàng</th>
                    <th>Thời gian</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.code}>
                      <td><strong>{order.code}</strong></td>
                      <td>
                        <div className="admin-customer-cell">
                          <span>{order.initials}</span>
                          <b>{order.customer}</b>
                        </div>
                      </td>
                      <td>{order.date}</td>
                      <td className="admin-order-total">{order.total}</td>
                      <td><span className={`admin-order-status is-${order.statusKey}`}><i />{order.status}</span></td>
                      <td><button type="button" className="admin-row-action" aria-label={`Xem chi tiết đơn ${order.code}`}><AdminIcon name="more" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
    </AdminLayout>
  )
}

export default AdminDashboardPage
