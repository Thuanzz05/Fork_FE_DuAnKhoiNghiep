import { useEffect, useState, useCallback } from 'react'
import { Navigate, Link } from 'react-router-dom'
import CustomerAccountSidebar from '../components/CustomerAccountSidebar'
import { getCurrentUser } from '../utils/auth'
import { getUserOrders, cancelOrder } from '../utils/orders'
import type { Order, OrderStatus } from '../utils/orders'
import { addCartItem } from '../utils/cart'
import { formatPrice } from '../data/products'
import { submitOrderReviews, getOrderReviews } from '../utils/reviews'
import './CustomerOrdersPage.css'

type FilterTab = 'ALL' | 'CHO_XAC_NHAN' | 'DANG_GIAO_HANG' | 'DA_GIAO_HANG' | 'DA_HUY'

function CustomerOrdersPage() {
  const [user] = useState(() => getCurrentUser())
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [actionNotice, setActionNotice] = useState({ message: '', type: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | 'thisMonth' | 'thisYear'>('all')

  const [reviewOrder, setReviewOrder] = useState<Order | null>(null)
  const [viewReviewsOrder, setViewReviewsOrder] = useState<Order | null>(null)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [existingReviews, setExistingReviews] = useState<any[]>([])

  const loadOrders = useCallback(() => {
    if (user) {
      setOrders(getUserOrders(user.id))
    }
  }, [user])

  useEffect(() => {
    loadOrders()

    const handleOrdersUpdated = () => {
      loadOrders()
    }

    window.addEventListener('orders-updated', handleOrdersUpdated)
    return () => {
      window.removeEventListener('orders-updated', handleOrdersUpdated)
    }
  }, [loadOrders])

  if (!user) return <Navigate to="/tai-khoan?che-do=dang-nhap" replace />

  const getOrderStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'CHO_XAC_NHAN':
        return 'Chờ xác nhận'
      case 'DA_XAC_NHAN':
        return 'Đã xác nhận'
      case 'DANG_DONG_GOI':
        return 'Đang đóng gói'
      case 'DANG_GIAO_HANG':
        return 'Đang giao hàng'
      case 'DA_GIAO_HANG':
        return 'Đã giao hàng'
      case 'DA_HUY':
        return 'Đã hủy'
      case 'TRA_HANG':
        return 'Trả hàng/Hoàn tiền'
      default:
        return status
    }
  }

  const getOrderStatusClass = (status: OrderStatus) => {
    switch (status) {
      case 'CHO_XAC_NHAN':
        return 'status-pending'
      case 'DA_XAC_NHAN':
      case 'DANG_DONG_GOI':
        return 'status-confirmed'
      case 'DANG_GIAO_HANG':
        return 'status-shipping'
      case 'DA_GIAO_HANG':
        return 'status-completed'
      case 'DA_HUY':
        return 'status-cancelled'
      case 'TRA_HANG':
        return 'status-refunded'
      default:
        return ''
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'COD':
        return 'Thanh toán khi nhận hàng (COD)'
      case 'CHUYEN_KHOAN':
        return 'Chuyển khoản ngân hàng'
      case 'MOMO':
        return 'Ví MoMo'
      case 'VNPAY':
        return 'VNPAY'
      case 'ZALOPAY':
        return 'ZaloPay'
      default:
        return method
    }
  }

  const filteredOrders = orders.filter((order) => {
    // 1. Lọc theo Tab trạng thái
    let matchesTab = true
    if (activeTab === 'DANG_GIAO_HANG') {
      matchesTab =
        order.orderStatus === 'DA_XAC_NHAN' ||
        order.orderStatus === 'DANG_DONG_GOI' ||
        order.orderStatus === 'DANG_GIAO_HANG'
    } else if (activeTab !== 'ALL') {
      matchesTab = order.orderStatus === activeTab
    }

    // 2. Lọc theo từ khóa tìm kiếm
    let matchesSearch = true
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      const matchesCode = order.orderCode.toLowerCase().includes(term)
      const matchesProduct = order.items.some((item) =>
        item.productName.toLowerCase().includes(term)
      )
      matchesSearch = matchesCode || matchesProduct
    }

    // 3. Lọc theo thời gian
    let matchesDate = true
    if (dateFilter !== 'all') {
      const orderTime = new Date(order.createdAt).getTime()
      const now = Date.now()
      if (dateFilter === '7days') {
        matchesDate = now - orderTime <= 7 * 24 * 60 * 60 * 1000
      } else if (dateFilter === '30days') {
        matchesDate = now - orderTime <= 30 * 24 * 60 * 60 * 1000
      } else if (dateFilter === 'thisMonth') {
        const orderDate = new Date(order.createdAt)
        const currentDate = new Date()
        matchesDate =
          orderDate.getMonth() === currentDate.getMonth() &&
          orderDate.getFullYear() === currentDate.getFullYear()
      } else if (dateFilter === 'thisYear') {
        const orderDate = new Date(order.createdAt)
        const currentDate = new Date()
        matchesDate = orderDate.getFullYear() === currentDate.getFullYear()
      }
    }

    return matchesTab && matchesSearch && matchesDate
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return sortBy === 'newest' ? timeB - timeA : timeA - timeB
  })

  const handleCancelClick = (orderId: string) => {
    setCancelOrderId(orderId)
    setCancelReason('Thay đổi ý định mua sắm')
  }

  const confirmCancelOrder = () => {
    if (!cancelOrderId) return
    const success = cancelOrder(cancelOrderId, cancelReason)
    if (success) {
      setActionNotice({ message: 'Hủy đơn hàng thành công!', type: 'success' })
      loadOrders()
      // Cập nhật selectedOrder nếu đang xem chi tiết đơn hàng đó
      if (selectedOrder && selectedOrder.id === cancelOrderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: 'DA_HUY', cancelReason } : null))
      }
    } else {
      setActionNotice({ message: 'Không thể hủy đơn hàng này.', type: 'error' })
    }
    setCancelOrderId(null)
    setTimeout(() => setActionNotice({ message: '', type: '' }), 3000)
  }

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addCartItem(item.productId, item.quantity)
    })
    setActionNotice({ message: 'Đã thêm tất cả sản phẩm vào giỏ hàng!', type: 'success' })
    setTimeout(() => setActionNotice({ message: '', type: '' }), 4000)
  }

  const handleReviewClick = (order: Order) => {
    setReviewOrder(order)
    const initialRatings: Record<string, number> = {}
    const initialComments: Record<string, string> = {}
    order.items.forEach((item) => {
      initialRatings[item.productId] = 5
      initialComments[item.productId] = ''
    })
    setRatings(initialRatings)
    setComments(initialComments)
  }

  const handleViewReviewsClick = (order: Order) => {
    setViewReviewsOrder(order)
    setExistingReviews(getOrderReviews(order.id))
  }

  const handleRatingChange = (productId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [productId]: value }))
  }

  const handleCommentChange = (productId: string, value: string) => {
    setComments((prev) => ({ ...prev, [productId]: value }))
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewOrder || !user) return

    const reviewsData = reviewOrder.items.map((item) => ({
      productId: item.productId,
      rating: ratings[item.productId] || 5,
      comment: comments[item.productId] || '',
    }))

    const userName = `${user.lastName} ${user.firstName}`.trim() || 'Khách hàng'

    submitOrderReviews(reviewOrder.id, user.id, userName, reviewsData)

    setActionNotice({
      message: 'Cảm ơn bạn đã gửi đánh giá sản phẩm thành công!',
      type: 'success',
    })
    setReviewOrder(null)
    loadOrders()

    setTimeout(() => {
      setActionNotice({ message: '', type: '' })
    }, 4000)
  }

  const formatDate = (isoString: string) => {
    const d = new Date(isoString)
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`
  }

  return (
    <main className="customer-account-page">
      <div className="customer-account-container customer-account-layout">
        <CustomerAccountSidebar user={user} />

        <div className="customer-account-main">
          {actionNotice.message && (
            <div className={`order-action-toast ${actionNotice.type}`} role="alert">
              <span>{actionNotice.message}</span>
              {actionNotice.message.includes('giỏ hàng') && (
                <Link to="/gio-hang" className="toast-link">
                  Xem giỏ hàng
                </Link>
              )}
            </div>
          )}

          <section className="customer-panel order-panel">
            <div className="customer-panel-heading">
              <div>
                <p>Quản lý giao dịch</p>
                <h1>Đơn hàng của tôi</h1>
              </div>
            </div>

            {/* Thanh tìm kiếm đơn hàng */}
            <div className="order-search-bar">
              <svg viewBox="0 0 24 24" className="search-icon" aria-hidden="true">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hàng hoặc tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="order-tabs" role="tablist" aria-label="Bộ lọc đơn hàng">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'CHO_XAC_NHAN', label: 'Chờ xác nhận' },
                { key: 'DANG_GIAO_HANG', label: 'Đang giao' },
                { key: 'DA_GIAO_HANG', label: 'Đã giao' },
                { key: 'DA_HUY', label: 'Đã hủy' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={activeTab === tab.key ? 'active' : ''}
                  onClick={() => setActiveTab(tab.key as FilterTab)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Bộ lọc nâng cao: Sắp xếp & Thời gian */}
            <div className="order-filters-row">
              <div className="filter-select-wrapper">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Sắp xếp đơn hàng"
                >
                  <option value="newest">Sắp xếp: Mới nhất</option>
                  <option value="oldest">Sắp xếp: Cũ nhất</option>
                </select>
              </div>

              <div className="filter-select-wrapper date-filter">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  aria-label="Lọc theo thời gian"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="7days">7 ngày gần đây</option>
                  <option value="30days">30 ngày gần đây</option>
                  <option value="thisMonth">Tháng này</option>
                  <option value="thisYear">Năm nay</option>
                </select>
                <svg viewBox="0 0 24 24" className="calendar-icon" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Orders List */}
            <div className="orders-list">
              {sortedOrders.length === 0 ? (
                <div className="order-empty">
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                  </svg>
                  <p>Không tìm thấy đơn hàng nào phù hợp.</p>
                  <Link to="/san-pham" className="start-shopping-btn">
                    Mua sắm ngay
                  </Link>
                </div>
              ) : (
                sortedOrders.map((order, index) => (
                  <article className="order-card" key={order.id}>
                    {index === 0 && sortBy === 'newest' && (
                      <span className="latest-order-badge">ĐƠN HÀNG MỚI NHẤT</span>
                    )}
                    <div className="order-card-header">
                      <div className="order-meta-info">
                        <span className="order-code-title">Đơn hàng <strong>#{order.orderCode}</strong></span>
                        <span className="order-date-separator">•</span>
                        <span className="order-date-text">{formatDate(order.createdAt)}</span>
                      </div>
                      <span className={`order-status-badge ${getOrderStatusClass(order.orderStatus)}`}>
                        {getOrderStatusText(order.orderStatus)}
                      </span>
                    </div>

                    <div className="order-card-body" onClick={() => setSelectedOrder(order)}>
                      {order.items.map((item) => (
                        <div className="order-product-item" key={item.productId}>
                          <div className="product-item-img">
                            <img src={item.productImage} alt={item.productName} />
                          </div>
                          <div className="product-item-info">
                            <h3>{item.productName}</h3>
                            <p className="product-item-meta">Phân loại: {item.weight}</p>
                            <span className="product-item-qty">x{item.quantity}</span>
                          </div>
                          <div className="product-item-price">
                            {formatPrice(item.price)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-card-footer">
                      <div className="order-price-summary">
                        <span>Tổng thanh toán: </span>
                        <strong>{formatPrice(order.totalPayment)}</strong>
                      </div>
                      <div className="order-actions-buttons">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Chi tiết
                        </button>
                        {order.orderStatus === 'CHO_XAC_NHAN' && (
                          <button
                            type="button"
                            className="btn-outline-danger"
                            onClick={() => handleCancelClick(order.id)}
                          >
                            Hủy đơn
                          </button>
                        )}
                        {order.orderStatus === 'DA_GIAO_HANG' && (
                          <>
                            {order.isReviewed ? (
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => handleViewReviewsClick(order)}
                              >
                                Xem đánh giá
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-outline-danger"
                                onClick={() => handleReviewClick(order)}
                              >
                                Đánh giá
                              </button>
                            )}
                          </>
                        )}
                        {(order.orderStatus === 'DA_GIAO_HANG' || order.orderStatus === 'DA_HUY') && (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => handleReorder(order)}
                          >
                            Mua lại
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="order-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <h2>Chi tiết đơn hàng #{selectedOrder.orderCode}</h2>
              <button type="button" className="close-modal-btn" onClick={() => setSelectedOrder(null)}>
                &times;
              </button>
            </div>

            <div className="order-modal-body">
              {/* Order Info & Delivery Timeline */}
              <div className="order-modal-grid">
                <div className="modal-info-section">
                  <h3>Thông tin nhận hàng</h3>
                  <div className="info-block">
                    <p><strong>Người nhận:</strong> {selectedOrder.recipientName}</p>
                    <p><strong>Điện thoại:</strong> {selectedOrder.phone}</p>
                    <p><strong>Địa chỉ nhận hàng:</strong> {selectedOrder.shippingAddress}</p>
                    {selectedOrder.customerNote && (
                      <p className="note-block"><strong>Ghi chú của bạn:</strong> "{selectedOrder.customerNote}"</p>
                    )}
                  </div>

                  <h3 style={{ marginTop: '20px' }}>Hình thức thanh toán</h3>
                  <div className="info-block">
                    <p><strong>Phương thức:</strong> {getPaymentMethodText(selectedOrder.paymentMethod)}</p>
                    <p>
                      <strong>Trạng thái thanh toán: </strong>
                      <span className={`payment-status-text ${selectedOrder.paymentStatus.toLowerCase()}`}>
                        {selectedOrder.paymentStatus === 'DA_THANH_TOAN'
                          ? 'Đã thanh toán'
                          : selectedOrder.paymentStatus === 'CHUA_THANH_TOAN'
                          ? 'Chưa thanh toán'
                          : selectedOrder.paymentStatus === 'THAT_BAI'
                          ? 'Giao dịch thất bại'
                          : 'Đã hoàn tiền'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="modal-timeline-section">
                  <h3>Hành trình đơn hàng</h3>
                  <div className="timeline-wrapper">
                    {selectedOrder.orderStatus === 'DA_HUY' ? (
                      <>
                        <div className="timeline-node past line-active">
                          <div className="node-icon">
                            <svg viewBox="0 0 24 24" className="timeline-svg">
                              <circle cx="9" cy="21" r="1" fill="currentColor" />
                              <circle cx="20" cy="21" r="1" fill="currentColor" />
                              <path d="M1 1h4l2.7 12.5a2 2 0 0 0 2 1.5h9.4a2 2 0 0 0 2-1.5L23 6H6" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                          </div>
                          <div className="node-content">
                            <h4>Đặt hàng thành công</h4>
                            <p className="node-desc">Đơn hàng đã được tiếp nhận và xử lý trên hệ thống.</p>
                            <span className="node-time">{formatDate(selectedOrder.createdAt)}</span>
                          </div>
                        </div>

                        <div className="timeline-node cancelled">
                          <div className="node-icon">
                            <svg viewBox="0 0 24 24" className="timeline-svg">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <div className="node-content">
                            <h4>Đã hủy đơn hàng</h4>
                            <p className="node-desc">Lý do: {selectedOrder.cancelReason || 'Người dùng hủy'}</p>
                            <span className="node-time">{formatDate(selectedOrder.createdAt)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Node 1: Đặt hàng thành công */}
                        <div className={`timeline-node ${
                          selectedOrder.orderStatus === 'CHO_XAC_NHAN' ? 'active' : 'past'
                        } ${selectedOrder.orderStatus !== 'CHO_XAC_NHAN' ? 'line-active' : ''}`}>
                          <div className="node-icon">
                            <svg viewBox="0 0 24 24" className="timeline-svg">
                              <circle cx="9" cy="21" r="1" fill="currentColor" />
                              <circle cx="20" cy="21" r="1" fill="currentColor" />
                              <path d="M1 1h4l2.7 12.5a2 2 0 0 0 2 1.5h9.4a2 2 0 0 0 2-1.5L23 6H6" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                          </div>
                          <div className="node-content">
                            <h4>Đặt hàng thành công</h4>
                            <p className="node-desc">Đơn hàng đã được tiếp nhận và xử lý trên hệ thống.</p>
                            <span className="node-time">{formatDate(selectedOrder.createdAt)}</span>
                          </div>
                        </div>

                        {/* Node 2: Đang chuẩn bị hàng */}
                        <div className={`timeline-node ${
                          ['DA_XAC_NHAN', 'DANG_DONG_GOI'].includes(selectedOrder.orderStatus)
                            ? 'active'
                            : ['DANG_GIAO_HANG', 'DA_GIAO_HANG'].includes(selectedOrder.orderStatus)
                            ? 'past'
                            : 'inactive'
                        } ${['DANG_GIAO_HANG', 'DA_GIAO_HANG'].includes(selectedOrder.orderStatus) ? 'line-active' : ''}`}>
                          <div className="node-icon">
                            <svg viewBox="0 0 24 24" className="timeline-svg">
                              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" fill="none" />
                              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
                              <path d="M12 12v10" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </div>
                          <div className="node-content">
                            <h4>Đang chuẩn bị hàng</h4>
                            <p className="node-desc">Red Bean Beauty đang chuẩn bị sản phẩm và đóng gói cẩn thận.</p>
                          </div>
                        </div>

                        {/* Node 3: Đang vận chuyển */}
                        <div className={`timeline-node ${
                          selectedOrder.orderStatus === 'DANG_GIAO_HANG'
                            ? 'active'
                            : selectedOrder.orderStatus === 'DA_GIAO_HANG'
                            ? 'past'
                            : 'inactive'
                        } ${selectedOrder.orderStatus === 'DA_GIAO_HANG' ? 'line-active' : ''}`}>
                          <div className="node-icon">
                            <svg viewBox="0 0 24 24" className="timeline-svg">
                              <rect x="2" y="11" width="13" height="8" rx="1" stroke="currentColor" strokeWidth="2.2" fill="none" />
                              <path d="M15 11l4 2v6h-4z" stroke="currentColor" strokeWidth="2.2" fill="none" />
                              <circle cx="5" cy="19" r="1.5" fill="currentColor" />
                              <circle cx="14" cy="19" r="1.5" fill="currentColor" />
                            </svg>
                          </div>
                          <div className="node-content">
                            <h4>Đang vận chuyển</h4>
                            <p className="node-desc">Shipper đang trên đường giao hàng đến địa chỉ của bạn.</p>
                          </div>
                        </div>

                        {/* Node 4: Giao hàng thành công */}
                        <div className={`timeline-node ${selectedOrder.orderStatus === 'DA_GIAO_HANG' ? 'active' : 'inactive'}`}>
                          <div className="node-icon">
                            <svg viewBox="0 0 24 24" className="timeline-svg">
                              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                          </div>
                          <div className="node-content">
                            <h4>Giao hàng thành công</h4>
                            <p className="node-desc">Đơn hàng đã được giao thành công đến bạn.</p>
                            {selectedOrder.orderStatus === 'DA_GIAO_HANG' && (
                              <span className="node-time">{formatDate(selectedOrder.createdAt)}</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="modal-items-section">
                <h3>Sản phẩm đã chọn</h3>
                <div className="modal-items-list">
                  {selectedOrder.items.map((item) => (
                    <div className="modal-product-row" key={item.productId}>
                      <img src={item.productImage} alt={item.productName} className="modal-prod-img" />
                      <div className="modal-prod-info">
                        <h4>{item.productName}</h4>
                        <span>Trọng lượng/Dung tích: {item.weight}</span>
                      </div>
                      <div className="modal-prod-qty">x{item.quantity}</div>
                      <div className="modal-prod-price">{formatPrice(item.price)}</div>
                      <div className="modal-prod-total">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Details */}
              <div className="modal-bill-summary">
                <div className="bill-line">
                  <span>Tổng tiền hàng:</span>
                  <span>{formatPrice(selectedOrder.totalProductPrice)}</span>
                </div>
                <div className="bill-line">
                  <span>Phí vận chuyển:</span>
                  <span>{formatPrice(selectedOrder.shippingFee)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="bill-line discount">
                    <span>Mã giảm giá:</span>
                    <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="bill-line grand-total">
                  <span>Thành tiền:</span>
                  <strong>{formatPrice(selectedOrder.totalPayment)}</strong>
                </div>
              </div>
            </div>

            <div className="order-modal-footer">
              {selectedOrder.orderStatus === 'CHO_XAC_NHAN' && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    handleCancelClick(selectedOrder.id)
                  }}
                >
                  Hủy đơn hàng này
                </button>
              )}
              {selectedOrder.orderStatus === 'DA_GIAO_HANG' && (
                <>
                  {selectedOrder.isReviewed ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ background: '#f5eded', border: '1px solid #dfd4d5' }}
                      onClick={() => {
                        setSelectedOrder(null)
                        handleViewReviewsClick(selectedOrder)
                      }}
                    >
                      Xem đánh giá
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-outline-danger"
                      onClick={() => {
                        setSelectedOrder(null)
                        handleReviewClick(selectedOrder)
                      }}
                    >
                      Đánh giá sản phẩm
                    </button>
                  )}
                </>
              )}
              {(selectedOrder.orderStatus === 'DA_GIAO_HANG' || selectedOrder.orderStatus === 'DA_HUY') && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleReorder(selectedOrder)}
                >
                  Đặt mua lại đơn này
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={() => setSelectedOrder(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Dialog */}
      {cancelOrderId && (
        <div className="order-modal-backdrop confirmation" onClick={() => setCancelOrderId(null)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Lý do hủy đơn hàng</h3>
            <p>Bạn chắc chắn muốn hủy đơn hàng này chứ? Hành động này không thể hoàn tác.</p>
            <div className="reason-selector">
              {[
                'Thay đổi ý định mua sắm',
                'Tìm thấy sản phẩm với giá rẻ hơn',
                'Muốn chọn phương thức thanh toán khác',
                'Nhập sai địa chỉ nhận hàng',
                'Khác',
              ].map((reason) => (
                <label key={reason} className="reason-radio">
                  <input
                    type="radio"
                    name="cancelReason"
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
              {cancelReason === 'Khác' && (
                <textarea
                  className="other-reason-input"
                  placeholder="Nhập lý do khác của bạn..."
                  rows={2}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              )}
            </div>
            <div className="confirmation-actions">
              <button type="button" className="btn-danger" onClick={confirmCancelOrder}>
                Xác nhận Hủy
              </button>
              <button type="button" className="btn-secondary" onClick={() => setCancelOrderId(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Review Entry Modal */}
      {reviewOrder && (
        <div className="order-modal-backdrop" onClick={() => setReviewOrder(null)}>
          <div className="order-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <h2>Đánh giá sản phẩm - Đơn hàng #{reviewOrder.orderCode}</h2>
              <button type="button" className="close-modal-btn" onClick={() => setReviewOrder(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleReviewSubmit}>
              <div className="order-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="reviews-list">
                  {reviewOrder.items.map((item) => (
                    <div className="reviews-product-row" key={item.productId}>
                      <img src={item.productImage} alt={item.productName} className="modal-prod-img" />
                      <div className="reviews-product-info-col">
                        <h4>{item.productName}</h4>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isSelected = star <= (ratings[item.productId] || 5)
                            return (
                              <button
                                key={star}
                                type="button"
                                className={`star-btn${isSelected ? ' selected' : ''}`}
                                onClick={() => handleRatingChange(item.productId, star)}
                              >
                                ★
                              </button>
                            )
                          })}
                        </div>
                        <textarea
                          className="review-textarea"
                          placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé (chất lượng, đóng gói, giao dịch...)"
                          value={comments[item.productId] || ''}
                          onChange={(e) => handleCommentChange(item.productId, e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-modal-footer">
                <button type="submit" className="btn-primary">
                  Gửi đánh giá
                </button>
                <button type="button" className="btn-secondary" onClick={() => setReviewOrder(null)}>
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Reviews Modal */}
      {viewReviewsOrder && (
        <div className="order-modal-backdrop" onClick={() => setViewReviewsOrder(null)}>
          <div className="order-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <h2>Đánh giá của bạn - Đơn hàng #{viewReviewsOrder.orderCode}</h2>
              <button type="button" className="close-modal-btn" onClick={() => setViewReviewsOrder(null)}>
                &times;
              </button>
            </div>
            <div className="order-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="reviews-list">
                {viewReviewsOrder.items.map((item) => {
                  const review = existingReviews.find((r) => r.productId === item.productId)
                  return (
                    <div className="reviews-product-row" key={item.productId}>
                      <img src={item.productImage} alt={item.productName} className="modal-prod-img" />
                      <div className="reviews-product-info-col">
                        <h4>{item.productName}</h4>
                        <div className="star-rating-read">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isSelected = star <= (review?.rating || 5)
                            return (
                              <span key={star} className={`star-icon${isSelected ? ' selected' : ''}`}>
                                ★
                              </span>
                            )
                          })}
                        </div>
                        <p className="review-comment-read">
                          {review?.comment ? `"${review.comment}"` : 'Không có bình luận nào.'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="order-modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setViewReviewsOrder(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default CustomerOrdersPage
