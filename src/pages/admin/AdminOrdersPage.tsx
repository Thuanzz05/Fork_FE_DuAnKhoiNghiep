import { useEffect, useMemo, useState } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import Pagination from '../../components/Pagination'
import { formatPrice } from '../../data/products'
import { usePagination } from '../../hooks/usePagination'
import {
  getOrders,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '../../utils/orders'
import './AdminOrdersPage.css'

type OrderPeriod = 'all' | 'today' | '7days' | '30days'
type OrderSort = 'newest' | 'oldest' | 'highest'

const orderStatusMeta: Record<OrderStatus, { label: string; tone: string }> = {
  CHO_XAC_NHAN: { label: 'Chờ xác nhận', tone: 'pending' },
  DA_XAC_NHAN: { label: 'Đã xác nhận', tone: 'confirmed' },
  DANG_DONG_GOI: { label: 'Đang đóng gói', tone: 'packing' },
  DANG_GIAO_HANG: { label: 'Đang giao hàng', tone: 'shipping' },
  DA_GIAO_HANG: { label: 'Đã giao hàng', tone: 'completed' },
  DA_HUY: { label: 'Đã hủy', tone: 'cancelled' },
  TRA_HANG: { label: 'Trả hàng', tone: 'returned' },
}

const paymentStatusMeta: Record<PaymentStatus, { label: string; tone: string }> = {
  CHUA_THANH_TOAN: { label: 'Chưa thanh toán', tone: 'unpaid' },
  DA_THANH_TOAN: { label: 'Đã thanh toán', tone: 'paid' },
  THAT_BAI: { label: 'Thanh toán lỗi', tone: 'failed' },
  DA_HOAN_TIEN: { label: 'Đã hoàn tiền', tone: 'refunded' },
}

const paymentMethodMeta: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng',
  CHUYEN_KHOAN: 'Chuyển khoản',
  MOMO: 'Ví MoMo',
  VNPAY: 'VNPay',
  ZALOPAY: 'ZaloPay',
}

const productCatalog: Record<string, Omit<OrderItem, 'quantity'>> = {
  combo: { productId: '1', productName: 'Combo chăm sóc da toàn diện đậu đỏ 3 món 150g', productImage: '/images/products/combo-3mon6.jpg', price: 450000, weight: '150g x 3' },
  cleanser: { productId: '2', productName: 'Sữa rửa mặt tạo bọt đậu đỏ 150g', productImage: '/images/products/sua-rua-mat-tao-bot3.jpg', price: 220000, weight: '150g' },
  mask: { productId: '3', productName: 'Mặt nạ tẩy tế bào chết đậu đỏ 150g', productImage: '/images/products/mat-na-tay-te-bao-chet6.jpg', price: 250000, weight: '150g' },
  toner: { productId: '4', productName: 'Toner dưỡng da đậu đỏ', productImage: '/images/products/toner-duong-da4.jpg', price: 220000, weight: '150g' },
  mini: { productId: '5', productName: 'Bộ combo dưỡng da đậu đỏ mini', productImage: '/images/products/combo-duong-da-mini4.png', price: 250000, weight: 'Mini size' },
  serum: { productId: '6', productName: 'Serum Đậu Đỏ Dưỡng sáng da', productImage: '/images/products/toner-duong-da6.png', price: 280000, weight: '30ml' },
  cream: { productId: '7', productName: 'Kem dưỡng ẩm Cấp ẩm, mịn da', productImage: '/images/products/combo-duong-da-mini.png', price: 290000, weight: '50g' },
}

interface SeedOrderConfig {
  code: string
  userId: string
  recipientName: string
  phone: string
  address: string
  createdAt: string
  items: Array<{ key: keyof typeof productCatalog; quantity: number }>
  discount: number
  shippingFee: number
  method: PaymentMethod
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  note?: string
  cancelReason?: string
}

const seedOrderConfigs: SeedOrderConfig[] = [
  { code: 'RBB-26071401', userId: 'customer-001', recipientName: 'Nguyễn Minh Anh', phone: '0912456780', address: 'Số 18 Nguyễn Trãi, Phường Thanh Xuân, Hà Nội', createdAt: '2026-07-14T08:35:00+07:00', items: [{ key: 'combo', quantity: 1 }, { key: 'toner', quantity: 1 }], discount: 0, shippingFee: 30000, method: 'COD', orderStatus: 'CHO_XAC_NHAN', paymentStatus: 'CHUA_THANH_TOAN', note: 'Giao hàng trong giờ hành chính.' },
  { code: 'RBB-26071402', userId: 'customer-005', recipientName: 'Trần Quang Huy', phone: '0903147258', address: '45 Lê Lợi, Phường Bến Nghé, TP. Hồ Chí Minh', createdAt: '2026-07-14T07:10:00+07:00', items: [{ key: 'combo', quantity: 1 }], discount: 30000, shippingFee: 30000, method: 'CHUYEN_KHOAN', orderStatus: 'DA_XAC_NHAN', paymentStatus: 'DA_THANH_TOAN' },
  { code: 'RBB-26071303', userId: 'customer-002', recipientName: 'Lê Thu Trang', phone: '0386921754', address: '120 Trần Phú, Phường Hà Đông, Hà Nội', createdAt: '2026-07-13T19:42:00+07:00', items: [{ key: 'cleanser', quantity: 2 }, { key: 'mask', quantity: 1 }], discount: 30000, shippingFee: 0, method: 'MOMO', orderStatus: 'DANG_DONG_GOI', paymentStatus: 'DA_THANH_TOAN' },
  { code: 'RBB-26071304', userId: 'customer-004', recipientName: 'Vũ Ngọc Hà', phone: '0325678419', address: '266 Cầu Giấy, Phường Cầu Giấy, Hà Nội', createdAt: '2026-07-13T16:18:00+07:00', items: [{ key: 'serum', quantity: 1 }, { key: 'toner', quantity: 1 }], discount: 0, shippingFee: 0, method: 'VNPAY', orderStatus: 'DANG_GIAO_HANG', paymentStatus: 'DA_THANH_TOAN' },
  { code: 'RBB-26071205', userId: 'customer-003', recipientName: 'Phạm Quốc Bảo', phone: '0963847120', address: '32 Hai Bà Trưng, Phường Hồng Bàng, Hải Phòng', createdAt: '2026-07-12T20:18:00+07:00', items: [{ key: 'mask', quantity: 1 }], discount: 0, shippingFee: 30000, method: 'COD', orderStatus: 'DA_GIAO_HANG', paymentStatus: 'DA_THANH_TOAN' },
  { code: 'RBB-26071206', userId: 'user-quang-demo', recipientName: 'Lê Văn Quang', phone: '0987654321', address: '15 Trần Hưng Đạo, Phường Bến Thành, TP. Hồ Chí Minh', createdAt: '2026-07-12T18:06:00+07:00', items: [{ key: 'cleanser', quantity: 1 }, { key: 'toner', quantity: 1 }], discount: 50000, shippingFee: 0, method: 'COD', orderStatus: 'DA_HUY', paymentStatus: 'CHUA_THANH_TOAN', cancelReason: 'Khách hàng yêu cầu thay đổi sản phẩm.' },
  { code: 'RBB-26071107', userId: 'customer-006', recipientName: 'Nguyễn Lan Anh', phone: '0938127465', address: '75 Nguyễn Huệ, Phường Thuận Hóa, Huế', createdAt: '2026-07-11T14:22:00+07:00', items: [{ key: 'serum', quantity: 1 }], discount: 0, shippingFee: 0, method: 'ZALOPAY', orderStatus: 'TRA_HANG', paymentStatus: 'DA_HOAN_TIEN', cancelReason: 'Sản phẩm bị móp hộp khi vận chuyển.' },
  { code: 'RBB-26071008', userId: 'customer-007', recipientName: 'Đỗ Minh Thư', phone: '0975612843', address: '19 Lý Thường Kiệt, Phường Ninh Kiều, Cần Thơ', createdAt: '2026-07-10T10:05:00+07:00', items: [{ key: 'combo', quantity: 2 }], discount: 50000, shippingFee: 0, method: 'COD', orderStatus: 'DA_GIAO_HANG', paymentStatus: 'DA_THANH_TOAN' },
  { code: 'RBB-26070909', userId: 'customer-008', recipientName: 'Hoàng Mai Phương', phone: '0357421869', address: '88 Võ Nguyên Giáp, Phường Hải Châu, Đà Nẵng', createdAt: '2026-07-09T13:45:00+07:00', items: [{ key: 'mini', quantity: 1 }, { key: 'cream', quantity: 1 }], discount: 0, shippingFee: 0, method: 'VNPAY', orderStatus: 'DA_GIAO_HANG', paymentStatus: 'DA_THANH_TOAN' },
  { code: 'RBB-26070810', userId: 'customer-009', recipientName: 'Bùi Đức Long', phone: '0863971524', address: '102 Trần Phú, Phường Nam Định, Ninh Bình', createdAt: '2026-07-08T09:30:00+07:00', items: [{ key: 'cleanser', quantity: 1 }], discount: 0, shippingFee: 30000, method: 'COD', orderStatus: 'DA_GIAO_HANG', paymentStatus: 'DA_THANH_TOAN' },
  { code: 'RBB-26070711', userId: 'customer-010', recipientName: 'Ngô Hải Yến', phone: '0391542876', address: '27 Hùng Vương, Phường Việt Trì, Phú Thọ', createdAt: '2026-07-07T21:12:00+07:00', items: [{ key: 'mask', quantity: 1 }, { key: 'serum', quantity: 1 }], discount: 50000, shippingFee: 0, method: 'MOMO', orderStatus: 'DA_GIAO_HANG', paymentStatus: 'DA_THANH_TOAN' },
  { code: 'RBB-26070512', userId: 'customer-011', recipientName: 'Trịnh Khánh Linh', phone: '0948251367', address: '60 Quang Trung, Phường Hạ Long, Quảng Ninh', createdAt: '2026-07-05T11:40:00+07:00', items: [{ key: 'toner', quantity: 2 }], discount: 0, shippingFee: 30000, method: 'CHUYEN_KHOAN', orderStatus: 'DA_GIAO_HANG', paymentStatus: 'DA_THANH_TOAN' },
]

const seedOrders: Order[] = seedOrderConfigs.map((config, index) => {
  const items = config.items.map(({ key, quantity }) => ({ ...productCatalog[key], quantity }))
  const totalProductPrice = items.reduce((total, item) => total + item.price * item.quantity, 0)
  return {
    id: `admin-order-${index + 1}`,
    orderCode: config.code,
    userId: config.userId,
    recipientName: config.recipientName,
    phone: config.phone,
    shippingAddress: config.address,
    customerNote: config.note,
    totalProductPrice,
    discountAmount: config.discount,
    shippingFee: config.shippingFee,
    totalPayment: totalProductPrice - config.discount + config.shippingFee,
    paymentMethod: config.method,
    orderStatus: config.orderStatus,
    paymentStatus: config.paymentStatus,
    createdAt: config.createdAt,
    cancelReason: config.cancelReason,
    items,
  }
})

const buildInitialOrders = () => {
  const orderMap = new Map(seedOrders.map((order) => [order.orderCode, order]))
  getOrders().forEach((order) => orderMap.set(order.orderCode, order))
  return Array.from(orderMap.values()).sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
}

const formatDateTime = (value: string) => new Date(value).toLocaleString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(buildInitialOrders)
  const [searchValue, setSearchValue] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | PaymentMethod>('all')
  const [periodFilter, setPeriodFilter] = useState<OrderPeriod>('all')
  const [sortBy, setSortBy] = useState<OrderSort>('newest')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [draftOrderStatus, setDraftOrderStatus] = useState<OrderStatus>('CHO_XAC_NHAN')
  const [draftPaymentStatus, setDraftPaymentStatus] = useState<PaymentStatus>('CHUA_THANH_TOAN')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!selectedOrder) return
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setSelectedOrder(null)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedOrder])

  const filteredOrders = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase('vi-VN')
    const now = new Date()

    const result = orders.filter((order) => {
      const createdAt = new Date(order.createdAt)
      const ageInDays = (now.getTime() - createdAt.getTime()) / 86400000
      const matchesKeyword = !keyword || [order.orderCode, order.recipientName, order.phone, order.shippingAddress]
        .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
      const matchesOrderStatus = orderStatusFilter === 'all' || order.orderStatus === orderStatusFilter
      const matchesPaymentStatus = paymentStatusFilter === 'all' || order.paymentStatus === paymentStatusFilter
      const matchesPaymentMethod = paymentMethodFilter === 'all' || order.paymentMethod === paymentMethodFilter
      const matchesPeriod = periodFilter === 'all'
        || (periodFilter === 'today' && createdAt.toDateString() === now.toDateString())
        || (periodFilter === '7days' && ageInDays >= 0 && ageInDays <= 7)
        || (periodFilter === '30days' && ageInDays >= 0 && ageInDays <= 30)
      return matchesKeyword && matchesOrderStatus && matchesPaymentStatus && matchesPaymentMethod && matchesPeriod
    })

    return result.sort((first, second) => {
      if (sortBy === 'oldest') return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
      if (sortBy === 'highest') return second.totalPayment - first.totalPayment
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    })
  }, [orderStatusFilter, orders, paymentMethodFilter, paymentStatusFilter, periodFilter, searchValue, sortBy])

  const { currentPage, totalPages, pageItems: paginatedOrders, setCurrentPage } = usePagination(
    filteredOrders,
    6,
    `${searchValue}|${orderStatusFilter}|${paymentStatusFilter}|${paymentMethodFilter}|${periodFilter}|${sortBy}`,
  )

  const pendingCount = orders.filter((order) => order.orderStatus === 'CHO_XAC_NHAN').length
  const processingCount = orders.filter((order) => ['DA_XAC_NHAN', 'DANG_DONG_GOI', 'DANG_GIAO_HANG'].includes(order.orderStatus)).length
  const deliveredRevenue = orders.filter((order) => order.orderStatus === 'DA_GIAO_HANG').reduce((total, order) => total + order.totalPayment, 0)

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order)
    setDraftOrderStatus(order.orderStatus)
    setDraftPaymentStatus(order.paymentStatus)
  }

  const saveOrderUpdate = () => {
    if (!selectedOrder) return
    const updatedOrder: Order = {
      ...selectedOrder,
      orderStatus: draftOrderStatus,
      paymentStatus: draftPaymentStatus,
      cancelReason: draftOrderStatus === 'DA_HUY' ? selectedOrder.cancelReason || 'Quản trị viên hủy đơn hàng.' : selectedOrder.cancelReason,
    }
    setOrders((current) => current.map((order) => order.id === selectedOrder.id ? updatedOrder : order))
    setSelectedOrder(updatedOrder)
    setNotice(`Đã cập nhật đơn ${selectedOrder.orderCode}`)
  }

  const refreshOrders = () => {
    setOrders(buildInitialOrders())
    setNotice('Đã làm mới danh sách đơn hàng')
  }

  return (
    <AdminLayout activeItem="orders" searchValue={searchValue} onSearchChange={setSearchValue} searchPlaceholder="Tìm mã đơn, khách hàng, số điện thoại...">
      <div className="admin-page-heading admin-orders-heading">
        <div><p>QUẢN LÝ BÁN HÀNG</p><h1>Quản lý đơn hàng</h1><span>Theo dõi xử lý, giao hàng và thanh toán của toàn bộ đơn.</span></div>
        <button type="button" className="admin-orders-refresh" onClick={refreshOrders}><AdminIcon name="orders" />Làm mới dữ liệu</button>
      </div>

      <section className="admin-order-summary" aria-label="Tổng quan đơn hàng">
        <article><span className="is-red"><AdminIcon name="orders" /></span><div><small>Tổng đơn hàng</small><strong>{orders.length}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="calendar" /></span><div><small>Chờ xác nhận</small><strong>{pendingCount}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="box" /></span><div><small>Đang xử lý</small><strong>{processingCount}</strong></div></article>
        <article><span className="is-green"><AdminIcon name="revenue" /></span><div><small>Doanh thu đã giao</small><strong>{formatPrice(deliveredRevenue)}</strong></div></article>
      </section>

      <section className="admin-orders-management-panel">
        <div className="admin-orders-toolbar">
          <div>
            <label><span>Đơn hàng</span><select value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value as 'all' | OrderStatus)} aria-label="Lọc trạng thái đơn hàng"><option value="all">Tất cả trạng thái</option>{Object.entries(orderStatusMeta).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label>
            <label><span>Thanh toán</span><select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value as 'all' | PaymentStatus)} aria-label="Lọc trạng thái thanh toán"><option value="all">Tất cả thanh toán</option>{Object.entries(paymentStatusMeta).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label>
            <label><span>Phương thức</span><select value={paymentMethodFilter} onChange={(event) => setPaymentMethodFilter(event.target.value as 'all' | PaymentMethod)} aria-label="Lọc phương thức thanh toán"><option value="all">Tất cả phương thức</option>{Object.entries(paymentMethodMeta).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label><span>Thời gian</span><select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value as OrderPeriod)} aria-label="Lọc thời gian đơn hàng"><option value="all">Tất cả thời gian</option><option value="today">Hôm nay</option><option value="7days">7 ngày gần đây</option><option value="30days">30 ngày gần đây</option></select></label>
            <label><span>Sắp xếp</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as OrderSort)} aria-label="Sắp xếp đơn hàng"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="highest">Giá trị cao nhất</option></select></label>
          </div>
          <span>Hiển thị <strong>{filteredOrders.length}</strong> / {orders.length} đơn</span>
        </div>

        <div className="admin-orders-management-table-wrap">
          <table className="admin-orders-management-table">
            <thead><tr><th>Mã đơn hàng</th><th>Khách hàng</th><th>Sản phẩm</th><th>Thanh toán</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const orderStatus = orderStatusMeta[order.orderStatus]
                const paymentStatus = paymentStatusMeta[order.paymentStatus]
                const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0)
                return (
                  <tr key={order.id}>
                    <td><div className="admin-order-code"><strong>{order.orderCode}</strong><span>{formatDateTime(order.createdAt)}</span></div></td>
                    <td><div className="admin-order-customer"><span>{order.recipientName.split(/\s+/).map((part) => part.charAt(0)).slice(-2).join('')}</span><div><strong>{order.recipientName}</strong><small>{order.phone}</small></div></div></td>
                    <td><div className="admin-order-products"><img src={order.items[0]?.productImage} alt="" /><div><strong>{order.items[0]?.productName}</strong><span>{totalQuantity} sản phẩm{order.items.length > 1 ? ` · +${order.items.length - 1} loại khác` : ''}</span></div></div></td>
                    <td><div className="admin-order-payment"><strong>{paymentMethodMeta[order.paymentMethod]}</strong><span className={`is-${paymentStatus.tone}`}>{paymentStatus.label}</span></div></td>
                    <td><strong className="admin-order-management-total">{formatPrice(order.totalPayment)}</strong></td>
                    <td><span className={`admin-order-management-status is-${orderStatus.tone}`}><i />{orderStatus.label}</span></td>
                    <td><button type="button" className="admin-order-view-button" onClick={() => openOrderDetail(order)} aria-label={`Xem đơn ${order.orderCode}`} title="Xem và cập nhật đơn hàng"><AdminIcon name="eye" /></button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 ? <div className="admin-orders-management-empty"><AdminIcon name="search" /><strong>Không tìm thấy đơn hàng</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredOrders.length} pageSize={6} itemLabel="đơn hàng" onPageChange={setCurrentPage} />
      </section>

      {selectedOrder ? (
        <div className="admin-order-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedOrder(null)}>
          <section className="admin-order-detail-modal" role="dialog" aria-modal="true" aria-labelledby="admin-order-detail-title">
            <header><div><span>CHI TIẾT ĐƠN HÀNG</span><h2 id="admin-order-detail-title">{selectedOrder.orderCode}</h2><small>Đặt lúc {formatDateTime(selectedOrder.createdAt)}</small></div><button type="button" onClick={() => setSelectedOrder(null)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <div className="admin-order-detail-body">
              <div className="admin-order-detail-main">
                <section><h3>Sản phẩm ({selectedOrder.items.reduce((total, item) => total + item.quantity, 0)})</h3><div className="admin-order-detail-items">{selectedOrder.items.map((item) => <article key={`${item.productId}-${item.weight}`}><img src={item.productImage} alt="" /><div><strong>{item.productName}</strong><span>{item.weight} · Số lượng: {item.quantity}</span></div><b>{formatPrice(item.price * item.quantity)}</b></article>)}</div></section>
                <section className="admin-order-customer-detail"><h3>Thông tin nhận hàng</h3><div><p><span>Người nhận</span><strong>{selectedOrder.recipientName}</strong></p><p><span>Số điện thoại</span><strong>{selectedOrder.phone}</strong></p><p><span>Địa chỉ</span><strong>{selectedOrder.shippingAddress}</strong></p>{selectedOrder.customerNote ? <p><span>Ghi chú</span><strong>{selectedOrder.customerNote}</strong></p> : null}{selectedOrder.cancelReason ? <p className="is-warning"><span>Lý do hủy/trả</span><strong>{selectedOrder.cancelReason}</strong></p> : null}</div></section>
              </div>
              <aside className="admin-order-detail-aside">
                <section><h3>Cập nhật trạng thái</h3><label><span>Trạng thái đơn hàng</span><select value={draftOrderStatus} onChange={(event) => setDraftOrderStatus(event.target.value as OrderStatus)}>{Object.entries(orderStatusMeta).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label><label><span>Trạng thái thanh toán</span><select value={draftPaymentStatus} onChange={(event) => setDraftPaymentStatus(event.target.value as PaymentStatus)}>{Object.entries(paymentStatusMeta).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label><button type="button" onClick={saveOrderUpdate}>Lưu cập nhật</button></section>
                <section className="admin-order-payment-summary"><h3>Thanh toán</h3><p><span>Tiền hàng</span><strong>{formatPrice(selectedOrder.totalProductPrice)}</strong></p><p><span>Giảm giá</span><strong>-{formatPrice(selectedOrder.discountAmount)}</strong></p><p><span>Phí vận chuyển</span><strong>{formatPrice(selectedOrder.shippingFee)}</strong></p><p className="is-total"><span>Tổng thanh toán</span><strong>{formatPrice(selectedOrder.totalPayment)}</strong></p><small>{paymentMethodMeta[selectedOrder.paymentMethod]}</small></section>
              </aside>
            </div>
          </section>
        </div>
      ) : null}

      {notice ? <div className="admin-order-toast" role="status"><span>✓</span>{notice}</div> : null}
    </AdminLayout>
  )
}

export default AdminOrdersPage
