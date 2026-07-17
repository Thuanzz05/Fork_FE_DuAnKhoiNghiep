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

interface PeriodStats {
  revenue: number
  orders: number
  customers: number
  units_sold: number
}

interface DashboardOrder {
  orderCode: string
  customerName?: string
  recipientName?: string
  createdAt: string
  total: number
  orderStatus: string
}

interface DashboardPeriodData {
  stats: PeriodStats
  changes: { revenue: number; orders: number; customers: number; unitsSold: number }
  revenueSeries: Array<{ bucket: number; revenue: number }>
  orderStatus: { total: number; completed: number; processing: number; pending: number; cancelled: number }
  bestSellingProducts: Array<{ id: string | null; name: string; sold: number }>
  recentOrders: DashboardOrder[]
}

interface DashboardData {
  periods: Record<RevenuePeriod, DashboardPeriodData>
}

interface RevenueChartData {
  title: string
  description: string
  ariaLabel: string
  maxValue: number
  items: Array<{ label: string; detail: string; value: number }>
}

const now = new Date()
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()
const currentQuarter = Math.floor(now.getMonth() / 3) + 1

const dashboardPeriodMeta: Record<RevenuePeriod, { label: string; comparison: string }> = {
  week: { label: '7 ngày gần đây', comparison: 'so với 7 ngày trước' },
  month: { label: `Tháng ${currentMonth}/${currentYear}`, comparison: 'so với tháng trước' },
  quarter: { label: `Quý ${currentQuarter}/${currentYear}`, comparison: 'so với quý trước' },
  year: { label: `Năm ${currentYear}`, comparison: `so với năm ${currentYear - 1}` },
}

const emptyPeriod: DashboardPeriodData = {
  stats: { revenue: 0, orders: 0, customers: 0, units_sold: 0 },
  changes: { revenue: 0, orders: 0, customers: 0, unitsSold: 0 },
  revenueSeries: [],
  orderStatus: { total: 0, completed: 0, processing: 0, pending: 0, cancelled: 0 },
  bestSellingProducts: [],
  recentOrders: [],
}

const chartWidth = 700
const chartHeight = 230
const chartPadding = { top: 18, right: 18, bottom: 38, left: 46 }
const plotWidth = chartWidth - chartPadding.left - chartPadding.right
const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom

const productChartWidth = 900
const productChartHeight = 285
const productChartPadding = { top: 35, right: 25, bottom: 55, left: 52 }
const productPlotWidth = productChartWidth - productChartPadding.left - productChartPadding.right
const productPlotHeight = productChartHeight - productChartPadding.top - productChartPadding.bottom
const productBarWidth = 76
const productTones = ['red', 'green', 'blue', 'orange', 'purple']

const formatPrice = (value: number) => `${value.toLocaleString('vi-VN')}đ`
const formatChange = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('vi-VN')}%`
const toPercentage = (value: number, total: number) => total ? (value / total) * 100 : 0

const getRevenueChart = (
  period: RevenuePeriod,
  series: DashboardPeriodData['revenueSeries'],
): RevenueChartData => {
  const values = new Map(series.map((item) => [item.bucket, item.revenue / 1_000_000]))
  let items: RevenueChartData['items']

  if (period === 'week') {
    items = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - 6 + index)
      const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
      return {
        label: weekday,
        detail: date.toLocaleDateString('vi-VN'),
        value: values.get(index + 1) ?? 0,
      }
    })
  } else if (period === 'month') {
    items = Array.from({ length: 5 }, (_, index) => ({
      label: `Tuần ${index + 1}`,
      detail: `Tuần ${index + 1} tháng ${currentMonth}`,
      value: values.get(index + 1) ?? 0,
    }))
  } else if (period === 'quarter') {
    const firstMonth = (currentQuarter - 1) * 3 + 1
    items = Array.from({ length: 3 }, (_, index) => ({
      label: `Tháng ${firstMonth + index}`,
      detail: `Tháng ${firstMonth + index}/${currentYear}`,
      value: values.get(index + 1) ?? 0,
    }))
  } else {
    items = Array.from({ length: 4 }, (_, index) => ({
      label: `Quý ${index + 1}`,
      detail: `Quý ${index + 1}/${currentYear}`,
      value: values.get(index + 1) ?? 0,
    }))
  }

  const label = dashboardPeriodMeta[period].label
  return {
    title: period === 'week' ? 'Doanh thu theo tuần' : period === 'month' ? 'Doanh thu theo tháng' : period === 'quarter' ? 'Doanh thu theo quý' : 'Doanh thu theo năm',
    description: `${label} · Đơn vị: triệu đồng`,
    ariaLabel: `Biểu đồ doanh thu ${label.toLocaleLowerCase('vi-VN')}`,
    maxValue: Math.max(1, ...items.map((item) => item.value)) * 1.15,
    items,
  }
}

const orderStatusMeta: Record<string, { label: string; tone: string }> = {
  CHO_XAC_NHAN: { label: 'Chờ xác nhận', tone: 'pending' },
  DA_XAC_NHAN: { label: 'Đã xác nhận', tone: 'confirmed' },
  DANG_CHUAN_BI: { label: 'Đang chuẩn bị', tone: 'packing' },
  DANG_GIAO: { label: 'Đang giao hàng', tone: 'shipping' },
  DA_GIAO: { label: 'Đã giao hàng', tone: 'completed' },
  DA_HUY: { label: 'Đã hủy', tone: 'cancelled' },
}

const getInitials = (name: string) => name.trim().split(/\s+/).slice(-2)
  .map((part) => part.charAt(0)).join('').toLocaleUpperCase('vi-VN') || 'KH'

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [dashboardPeriod, setDashboardPeriod] = useState<RevenuePeriod>('month')
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<DashboardData>('/admin/dashboard')
      .then((data) => {
        setDashboard(data)
        setError('')
      })
      .catch(() => {
        setDashboard(null)
        setError('Không thể tải dữ liệu dashboard từ máy chủ.')
      })
  }, [])

  const periodMeta = dashboardPeriodMeta[dashboardPeriod]
  const periodData = dashboard?.periods?.[dashboardPeriod] ?? emptyPeriod
  const stats: DashboardStat[] = [
    { label: 'Tổng doanh thu', value: formatPrice(periodData.stats.revenue), change: formatChange(periodData.changes.revenue), note: periodMeta.comparison, icon: 'revenue', tone: 'red' },
    { label: 'Tổng đơn hàng', value: periodData.stats.orders.toLocaleString('vi-VN'), change: formatChange(periodData.changes.orders), note: periodMeta.comparison, icon: 'cart', tone: 'blue' },
    { label: 'Khách hàng mới', value: periodData.stats.customers.toLocaleString('vi-VN'), change: formatChange(periodData.changes.customers), note: periodMeta.comparison, icon: 'userPlus', tone: 'green' },
    { label: 'Sản phẩm đã bán', value: periodData.stats.units_sold.toLocaleString('vi-VN'), change: formatChange(periodData.changes.unitsSold), note: periodMeta.comparison, icon: 'box', tone: 'orange' },
  ]

  const revenueChart = getRevenueChart(dashboardPeriod, periodData.revenueSeries)
  const orderCounts = periodData.orderStatus
  const orderStatus = {
    total: orderCounts.total,
    completed: toPercentage(orderCounts.completed, orderCounts.total),
    processing: toPercentage(orderCounts.processing, orderCounts.total),
    pending: toPercentage(orderCounts.pending, orderCounts.total),
    cancelled: toPercentage(orderCounts.cancelled, orderCounts.total),
  }
  const completedOrderCount = orderCounts.completed
  const processingOrderCount = orderCounts.processing
  const pendingOrderCount = orderCounts.pending
  const cancelledOrderCount = orderCounts.cancelled

  const bestSellingProducts = periodData.bestSellingProducts.map((product, index) => ({
    ...product,
    shortName: product.name.length > 18 ? `${product.name.slice(0, 17)}…` : product.name,
    tone: productTones[index % productTones.length],
  }))
  const maximumProductSales = Math.max(0, ...bestSellingProducts.map((product) => product.sold))
  const productSales = { maxValue: Math.max(4, Math.ceil(maximumProductSales / 4) * 4) }
  const productBarBand = productPlotWidth / Math.max(bestSellingProducts.length, 1)

  const recentOrders = periodData.recentOrders.map((item) => {
    const customer = item.customerName || item.recipientName || 'Khách hàng'
    const status = orderStatusMeta[item.orderStatus] ?? { label: item.orderStatus, tone: 'pending' }
    return {
      code: item.orderCode,
      initials: getInitials(customer),
      customer,
      date: new Date(item.createdAt).toLocaleString('vi-VN'),
      total: formatPrice(Number(item.total || 0)),
      status: status.label,
      statusKey: status.tone,
    }
  })

  const chartPoints = revenueChart.items.map((item, index) => {
    const x = chartPadding.left + (index * plotWidth) / Math.max(revenueChart.items.length - 1, 1)
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
    ? Math.min(Math.max(hoveredRevenuePoint.x - revenueTooltipWidth / 2, chartPadding.left), chartWidth - chartPadding.right - revenueTooltipWidth)
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

          {error ? <section className="admin-panel"><p>{error}</p></section> : null}

          <section className="admin-stats-grid" aria-label="Các chỉ số tổng quan">
            {stats.map((stat) => (
              <article className="admin-stat-card" key={stat.label}>
                <div className={`admin-stat-icon admin-stat-icon-${stat.tone}`}>
                  <AdminIcon name={stat.icon} />
                </div>
                <div className="admin-stat-content">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <p><b>{stat.change}</b> {stat.note}</p>
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
                  {recentOrders.length === 0 ? <tr><td colSpan={6}>Chưa có đơn hàng trong khoảng thời gian này.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
    </AdminLayout>
  )
}

export default AdminDashboardPage
