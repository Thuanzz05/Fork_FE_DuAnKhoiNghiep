import { useEffect, useMemo, useState } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import Pagination from '../../components/Pagination'
import { formatPrice } from '../../data/products'
import { api } from '../../services/api'
import {
  type Order,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
  type RefundStatus,
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
}

const paymentStatusMeta: Record<PaymentStatus, { label: string; tone: string }> = {
  CHUA_THANH_TOAN: { label: 'Chưa thanh toán', tone: 'unpaid' },
  DA_THANH_TOAN: { label: 'Đã thanh toán', tone: 'paid' },
  THAT_BAI: { label: 'Thanh toán lỗi', tone: 'failed' },
  DA_HOAN_TIEN: { label: 'Đã hoàn tiền', tone: 'refunded' },
}

const refundStatusMeta: Record<RefundStatus, string> = {
  YEU_CAU_HOAN_TIEN: 'Yêu cầu hoàn tiền',
  DANG_HOAN_TIEN: 'Đang hoàn tiền',
  DA_HOAN_TIEN: 'Đã hoàn tiền',
  HOAN_TIEN_THAT_BAI: 'Hoàn tiền thất bại',
}

const paymentMethodMeta: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng',
  CHUYEN_KHOAN: 'Chuyển khoản',
}

const allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> = {
  CHO_XAC_NHAN: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DA_HUY'],
  DA_XAC_NHAN: ['DA_XAC_NHAN', 'DANG_DONG_GOI', 'DA_HUY'],
  DANG_DONG_GOI: ['DANG_DONG_GOI', 'DANG_GIAO_HANG', 'DA_HUY'],
  DANG_GIAO_HANG: ['DANG_GIAO_HANG', 'DA_GIAO_HANG'],
  DA_GIAO_HANG: ['DA_GIAO_HANG'],
  DA_HUY: ['DA_HUY'],
}

const buildInitialOrders = (): Order[] => []

const formatDateTime = (value: string) => new Date(value).toLocaleString('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(buildInitialOrders)
  const [deliveredRevenue, setDeliveredRevenue] = useState(0)
  const [serverPage, setServerPage] = useState(1)
  const [serverTotalPages, setServerTotalPages] = useState(1)
  const [serverTotal, setServerTotal] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [processingTotal, setProcessingTotal] = useState(0)

  const mapOrderStatus = (status: string): OrderStatus => ({
    DANG_CHUAN_BI: 'DANG_DONG_GOI', DANG_GIAO: 'DANG_GIAO_HANG', DA_GIAO: 'DA_GIAO_HANG',
  }[status] as OrderStatus || status as OrderStatus)
  const toBackendStatus = (status: OrderStatus) => ({
    DANG_DONG_GOI: 'DANG_CHUAN_BI', DANG_GIAO_HANG: 'DANG_GIAO', DA_GIAO_HANG: 'DA_GIAO',
  } as Record<string, string>)[status] || status

  const loadOrders = async () => {
    try {
      const [list, dashboard] = await Promise.all([
        api.get<{ items: Array<Record<string, any>>; pagination: { total: number; totalPages: number } }>(`/admin/orders?${new URLSearchParams({
          page: String(serverPage), limit: '6',
          ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
          ...(orderStatusFilter !== 'all' ? { status: toBackendStatus(orderStatusFilter) } : {}),
          ...(paymentStatusFilter !== 'all' ? { paymentStatus: paymentStatusFilter } : {}),
          ...(paymentMethodFilter !== 'all' ? { paymentMethod: paymentMethodFilter } : {}),
          ...(periodFilter !== 'all' ? { period: periodFilter } : {}),
          sort: sortBy,
        })}`),
        api.get<{ summary: { pending_orders: number; processing_orders: number; delivered_revenue: number } }>('/admin/dashboard'),
      ])
      setDeliveredRevenue(Number(dashboard.summary.delivered_revenue))
      setPendingTotal(Number(dashboard.summary.pending_orders))
      setProcessingTotal(Number(dashboard.summary.processing_orders))
      setServerTotal(list.pagination.total)
      setServerTotalPages(Math.max(list.pagination.totalPages, 1))
      setOrders(list.items.map((item) => ({
        id: String(item.id), orderCode: String(item.orderCode), userId: String(item.customerId),
        recipientName: String(item.recipientName), phone: String(item.phone), shippingAddress: String(item.shippingAddress),
        customerNote: item.customerNote, totalProductPrice: Number(item.subtotal), discountAmount: Number(item.discount),
        shippingFee: Number(item.shippingFee), totalPayment: Number(item.total), paymentMethod: item.paymentMethod as PaymentMethod,
        orderStatus: mapOrderStatus(String(item.orderStatus)), paymentStatus: item.paymentStatus as PaymentStatus,
        createdAt: String(item.createdAt), cancelReason: item.cancelReason,
        lineCount: Number(item.lineCount), itemCount: Number(item.itemCount),
        refundRequestId: item.refundRequestId == null ? null : String(item.refundRequestId),
        refundStatus: item.refundStatus as RefundStatus | null,
        refundAmount: item.refundAmount == null ? null : Number(item.refundAmount),
        refundReason: item.refundReason, refundAdminNote: item.refundAdminNote,
        items: (item.items || []).map((line: Record<string, any>) => ({
          productId: String(line.productId), productName: String(line.name), productImage: String(line.image || ''),
          price: Number(line.unitPrice), quantity: Number(line.quantity), weight: '',
        })),
      })))
    } catch {
      setOrders([])
    }
  }

  const [searchValue, setSearchValue] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | PaymentMethod>('all')
  const [periodFilter, setPeriodFilter] = useState<OrderPeriod>('all')
  const [sortBy, setSortBy] = useState<OrderSort>('newest')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [draftOrderStatus, setDraftOrderStatus] = useState<OrderStatus>('CHO_XAC_NHAN')
  const [draftPaymentStatus, setDraftPaymentStatus] = useState<PaymentStatus>('CHUA_THANH_TOAN')
  const [createRefundRequest, setCreateRefundRequest] = useState(false)
  const [draftRefundStatus, setDraftRefundStatus] = useState<RefundStatus | ''>('')
  const [refundAdminNote, setRefundAdminNote] = useState('')
  const [notice, setNotice] = useState('')

  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadOrders() }, [serverPage, searchValue, orderStatusFilter, paymentStatusFilter, paymentMethodFilter, periodFilter, sortBy])
  useEffect(() => { setServerPage(1) }, [searchValue, orderStatusFilter, paymentStatusFilter, paymentMethodFilter, periodFilter, sortBy])

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

  const currentPage = serverPage
  const totalPages = serverTotalPages
  const paginatedOrders = filteredOrders
  const setCurrentPage = setServerPage

  const openOrderDetail = async (order: Order) => {
    try {
      const item = await api.get<Record<string, any>>(`/admin/orders/${order.id}`)
      const detailedOrder: Order = {
        ...order,
        items: (item.items || []).map((line: Record<string, any>) => ({
          productId: String(line.productId), productName: String(line.name), productImage: String(line.image || ''),
          price: Number(line.unitPrice), quantity: Number(line.quantity), weight: '',
        })),
      }
      setSelectedOrder(detailedOrder)
      setDraftOrderStatus(detailedOrder.orderStatus)
      setDraftPaymentStatus(detailedOrder.paymentStatus)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể tải chi tiết đơn hàng')
      return
    }
    setCreateRefundRequest(false)
    setDraftRefundStatus(order.refundStatus || '')
    setRefundAdminNote(order.refundAdminNote || '')
  }

  const saveOrderUpdate = async () => {
    if (!selectedOrder) return
    const cancellingPaidOrder = draftOrderStatus === 'DA_HUY'
      && selectedOrder.orderStatus !== 'DA_HUY'
      && selectedOrder.paymentStatus === 'DA_THANH_TOAN'
    if (cancellingPaidOrder && !createRefundRequest) {
      setNotice('Đơn đã thanh toán: phải chọn tạo yêu cầu hoàn tiền trước khi hủy')
      return
    }
    const updatedOrder: Order = {
      ...selectedOrder,
      orderStatus: draftOrderStatus,
      paymentStatus: draftPaymentStatus,
      cancelReason: draftOrderStatus === 'DA_HUY' ? selectedOrder.cancelReason || 'Quản trị viên hủy đơn hàng.' : selectedOrder.cancelReason,
    }
    try {
      await api.patch(`/admin/orders/${selectedOrder.id}`, {
        orderStatus: toBackendStatus(draftOrderStatus),
        cancelReason: draftOrderStatus === 'DA_HUY' ? updatedOrder.cancelReason : undefined,
        refundAction: cancellingPaidOrder && createRefundRequest ? 'TAO_YEU_CAU' : undefined,
        refundStatus: selectedOrder.refundStatus && draftRefundStatus !== selectedOrder.refundStatus
          ? draftRefundStatus : undefined,
        refundAdminNote: refundAdminNote.trim() || undefined,
      })
      await loadOrders()
      setSelectedOrder(updatedOrder)
      setNotice(`Đã cập nhật đơn ${selectedOrder.orderCode}`)
      window.dispatchEvent(new Event('admin-orders-updated'))
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể cập nhật đơn hàng')
    }
  }

  const refreshOrders = () => {
    void loadOrders()
    setNotice('Đã làm mới danh sách đơn hàng')
  }

  return (
    <AdminLayout activeItem="orders" searchValue={searchValue} onSearchChange={setSearchValue} searchPlaceholder="Tìm mã đơn, khách hàng, số điện thoại...">
      <div className="admin-page-heading admin-orders-heading">
        <div><p>QUẢN LÝ BÁN HÀNG</p><h1>Quản lý đơn hàng</h1><span>Theo dõi xử lý, giao hàng và thanh toán của toàn bộ đơn.</span></div>
        <button type="button" className="admin-orders-refresh" onClick={refreshOrders}><AdminIcon name="orders" />Làm mới dữ liệu</button>
      </div>

      <section className="admin-order-summary" aria-label="Tổng quan đơn hàng">
        <article><span className="is-red"><AdminIcon name="orders" /></span><div><small>Tổng đơn hàng</small><strong>{serverTotal}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="calendar" /></span><div><small>Chờ xác nhận</small><strong>{pendingTotal}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="box" /></span><div><small>Đang xử lý</small><strong>{processingTotal}</strong></div></article>
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
          <span>Hiển thị <strong>{filteredOrders.length}</strong> / {serverTotal} đơn</span>
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
                    <td><div className="admin-order-products"><div><strong>{order.lineCount ?? order.items.length} dòng sản phẩm</strong><span>{order.itemCount ?? totalQuantity} sản phẩm</span></div></div></td>
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
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={serverTotal} pageSize={6} itemLabel="đơn hàng" onPageChange={setCurrentPage} />
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
                <section>
                  <h3>Cập nhật trạng thái</h3>
                  <label><span>Trạng thái đơn hàng</span><select value={draftOrderStatus} onChange={(event) => setDraftOrderStatus(event.target.value as OrderStatus)}>{allowedOrderTransitions[selectedOrder.orderStatus].map((value) => <option value={value} key={value}>{orderStatusMeta[value].label}</option>)}</select></label>
                  <label><span>Trạng thái thanh toán</span><input value={paymentStatusMeta[draftPaymentStatus].label} readOnly /></label>
                  {draftOrderStatus === 'DA_HUY' && selectedOrder.orderStatus !== 'DA_HUY' && selectedOrder.paymentStatus === 'DA_THANH_TOAN' ? (
                    <label><span>Xử lý tiền đã thanh toán</span><select value={createRefundRequest ? 'TAO_YEU_CAU' : ''} onChange={(event) => setCreateRefundRequest(event.target.value === 'TAO_YEU_CAU')}><option value="">-- Bắt buộc chọn --</option><option value="TAO_YEU_CAU">Tạo yêu cầu hoàn tiền</option></select></label>
                  ) : null}
                  {selectedOrder.refundStatus ? (
                    <>
                      <label><span>Quy trình hoàn tiền</span><select value={draftRefundStatus} onChange={(event) => setDraftRefundStatus(event.target.value as RefundStatus)}>{Object.entries(refundStatusMeta).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                      <label><span>Ghi chú hoàn tiền</span><textarea value={refundAdminNote} onChange={(event) => setRefundAdminNote(event.target.value)} placeholder="Mã giao dịch hoàn, lý do thất bại..." /></label>
                    </>
                  ) : null}
                  <button type="button" onClick={saveOrderUpdate}>Lưu cập nhật</button>
                </section>
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
