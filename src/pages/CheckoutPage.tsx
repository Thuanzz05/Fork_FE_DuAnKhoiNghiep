import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../utils/auth'
import { createOrder } from '../utils/orders'
import { getCartItems, saveCartItems } from '../utils/cart'
import { formatPrice, products } from '../data/products'
import './CheckoutPage.css'

interface LocationState {
  selectedIds?: string[]
}

function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null
  const selectedIds = useMemo(() => state?.selectedIds || [], [state])

  const [user] = useState(() => getCurrentUser())

  // Form states
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [recipientName, setRecipientName] = useState('')
  const [phone, setPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [useCustomAddress, setUseCustomAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CHUYEN_KHOAN' | 'MOMO' | 'VNPAY'>('COD')
  const [customerNote, setCustomerNote] = useState('')

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null)
  const [voucherDiscount, setVoucherDiscount] = useState(0)
  const [voucherNotice, setVoucherNotice] = useState({ message: '', type: '' })

  // Redirect if not logged in or no selected products
  useEffect(() => {
    if (!getCurrentUser()) {
      navigate('/tai-khoan?che-do=dang-nhap', { replace: true })
      return
    }

    if (selectedIds.length === 0) {
      navigate('/gio-hang', { replace: true })
    }
  }, [selectedIds, navigate])

  // Load user default address if exists
  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find((addr) => addr.isDefault) || user.addresses[0]
      setSelectedAddressId(defaultAddr.id)
      setRecipientName(defaultAddr.recipientName)
      setPhone(defaultAddr.phone)
      setShippingAddress(`${defaultAddr.detail}, ${defaultAddr.wardName}, ${defaultAddr.provinceName}`)
    } else if (user) {
      setRecipientName(`${user.lastName} ${user.firstName}`.trim())
      setPhone(user.phone || '')
      setUseCustomAddress(true)
    }
  }, [user])

  // When selected address ID changes, update input fields
  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    setUseCustomAddress(false)
    if (user) {
      const addr = user.addresses.find((a) => a.id === addressId)
      if (addr) {
        setRecipientName(addr.recipientName)
        setPhone(addr.phone)
        setShippingAddress(`${addr.detail}, ${addr.wardName}, ${addr.provinceName}`)
      }
    }
  }

  const handleCustomAddressToggle = () => {
    setUseCustomAddress(true)
    setSelectedAddressId('')
    setRecipientName(user ? `${user.lastName} ${user.firstName}`.trim() : '')
    setPhone(user?.phone || '')
    setShippingAddress('')
  }

  // Get selected products and quantities
  const checkoutItems = useMemo(() => {
    const cartItems = getCartItems()
    return selectedIds
      .map((id) => {
        const cartItem = cartItems.find((item) => item.productId === id)
        const product = products.find((p) => p.id === id)
        return product ? { product, quantity: cartItem?.quantity || 1 } : null
      })
      .filter((item): item is { product: typeof products[0]; quantity: number } => Boolean(item))
  }, [selectedIds])

  // Billing calculations
  const totalProductPrice = useMemo(() => {
    return checkoutItems.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }, [checkoutItems])

  const originalShippingFee = totalProductPrice >= 300000 ? 0 : 30000

  const shippingFee = useMemo(() => {
    if (appliedVoucher === 'FREESHIP') return 0
    return originalShippingFee
  }, [appliedVoucher, originalShippingFee])

  const totalPayment = useMemo(() => {
    const finalAmount = totalProductPrice + shippingFee - voucherDiscount
    return Math.max(0, finalAmount)
  }, [totalProductPrice, shippingFee, voucherDiscount])

  // Voucher apply handler
  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase()
    if (!code) return

    if (code === 'REDBEAN50') {
      if (totalProductPrice < 200000) {
        setVoucherNotice({
          message: 'Mã REDBEAN50 chỉ áp dụng cho đơn hàng từ 200.000đ.',
          type: 'error',
        })
        return
      }
      setAppliedVoucher('REDBEAN50')
      setVoucherDiscount(50000)
      setVoucherNotice({ message: 'Áp dụng mã giảm 50.000đ thành công!', type: 'success' })
    } else if (code === 'FREESHIP') {
      if (originalShippingFee === 0) {
        setVoucherNotice({
          message: 'Đơn hàng của bạn đã được miễn phí vận chuyển sẵn.',
          type: 'error',
        })
        return
      }
      setAppliedVoucher('FREESHIP')
      setVoucherDiscount(0) // Free shipping reduces shipping fee to 0, handled in shippingFee useMemo
      setVoucherNotice({ message: 'Miễn phí vận chuyển thành công!', type: 'success' })
    } else {
      setVoucherNotice({ message: 'Mã giảm giá không tồn tại hoặc đã hết hạn.', type: 'error' })
    }
  }

  // Handle Order Submit
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return
    if (checkoutItems.length === 0) return

    if (!recipientName.trim() || !phone.trim() || !shippingAddress.trim()) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng.')
      return
    }

    const orderItems = checkoutItems.map(({ product, quantity }) => ({
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      price: product.price,
      quantity,
      weight: product.weight,
    }))

    createOrder({
      userId: user.id,
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      shippingAddress: shippingAddress.trim(),
      customerNote: customerNote.trim() || undefined,
      totalProductPrice,
      discountAmount: voucherDiscount + (appliedVoucher === 'FREESHIP' ? originalShippingFee : 0),
      shippingFee,
      totalPayment,
      paymentMethod,
      orderStatus: 'CHO_XAC_NHAN',
      paymentStatus: 'CHUA_THANH_TOAN',
      items: orderItems,
    })

    // Remove purchased products from cart
    const cartItems = getCartItems()
    const remainingCartItems = cartItems.filter((item) => !selectedIds.includes(item.productId))
    saveCartItems(remainingCartItems)

    // Redirect to orders page
    navigate('/tai-khoan/don-hang', { replace: true })
  }

  return (
    <main className="checkout-page">
      <div className="checkout-breadcrumb">
        <div className="checkout-container">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/gio-hang">Giỏ hàng</Link>
          <span>/</span>
          <span>Thanh toán</span>
        </div>
      </div>

      <div className="checkout-container checkout-content">
        <h1 className="checkout-title">Thanh toán đơn hàng</h1>

        <form onSubmit={handlePlaceOrder} className="checkout-grid">
          {/* Left Column: Shipping & Payment */}
          <div className="checkout-left-col">
            {/* Delivery address selection */}
            <section className="checkout-section">
              <h2>1. Địa chỉ giao hàng</h2>

              {user && user.addresses && user.addresses.length > 0 && (
                <div className="address-selections">
                  {user.addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`address-radio-label${selectedAddressId === addr.id ? ' active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="delivery_address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => handleAddressSelect(addr.id)}
                      />
                      <div className="address-radio-info">
                        <strong>
                          {addr.recipientName} ({addr.phone})
                        </strong>
                        <p>
                          {addr.detail}, {addr.wardName}, {addr.provinceName}
                        </p>
                        {addr.isDefault && <span className="default-badge">Mặc định</span>}
                      </div>
                    </label>
                  ))}

                  <label className={`address-radio-label${useCustomAddress ? ' active' : ''}`}>
                    <input
                      type="radio"
                      name="delivery_address"
                      checked={useCustomAddress}
                      onChange={handleCustomAddressToggle}
                    />
                    <div className="address-radio-info">
                      <strong>Giao đến địa chỉ khác</strong>
                    </div>
                  </label>
                </div>
              )}

              {/* Direct inputs if useCustomAddress or no address saved */}
              {useCustomAddress && (
                <div className="address-custom-fields">
                  <div className="form-group-row">
                    <label className="form-group">
                      <span>Họ tên người nhận *</span>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Nhập họ và tên"
                        required
                      />
                    </label>

                    <label className="form-group">
                      <span>Số điện thoại *</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Nhập số điện thoại"
                        pattern="[0-9]{9,11}"
                        required
                      />
                    </label>
                  </div>

                  <label className="form-group">
                    <span>Địa chỉ chi tiết (Số nhà, tên đường, phường/xã, quận, tỉnh...) *</span>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Ví dụ: Số 12, ngõ 34 Trần Hưng Đạo, P. Bến Thành, Quận 1, TP. HCM"
                      required
                    />
                  </label>
                </div>
              )}
            </section>

            {/* Payment Method */}
            <section className="checkout-section">
              <h2>2. Phương thức thanh toán</h2>
              <div className="payment-options">
                {[
                  {
                    id: 'COD',
                    title: 'Thanh toán khi nhận hàng (COD)',
                    desc: 'Thanh toán bằng tiền mặt trực tiếp cho shipper khi nhận được hàng.',
                    icon: '💵',
                  },
                  {
                    id: 'CHUYEN_KHOAN',
                    title: 'Chuyển khoản ngân hàng',
                    desc: 'Chuyển khoản trực tiếp tới số tài khoản Red Bean Beauty trước khi giao hàng.',
                    icon: '🏦',
                  },
                  {
                    id: 'MOMO',
                    title: 'Ví điện tử MoMo',
                    desc: 'Thanh toán trực tuyến an toàn, nhanh chóng qua ứng dụng Ví MoMo.',
                    icon: '👛',
                  },
                  {
                    id: 'VNPAY',
                    title: 'Cổng thanh toán VNPAY',
                    desc: 'Thanh toán qua tài khoản ngân hàng, ATM nội địa hoặc quét mã QR Code.',
                    icon: '💳',
                  },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={`payment-option-card${paymentMethod === option.id ? ' selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === option.id}
                      onChange={() => setPaymentMethod(option.id as any)}
                    />
                    <span className="payment-icon">{option.icon}</span>
                    <div className="payment-desc">
                      <strong>{option.title}</strong>
                      <p>{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Customer Note */}
            <section className="checkout-section">
              <h2>3. Ghi chú đơn hàng</h2>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Ghi chú thêm cho người bán hoặc shipper (ví dụ: giao giờ hành chính, gọi điện trước khi giao...)"
                rows={3}
                className="checkout-note-textarea"
              />
            </section>
          </div>

          {/* Right Column: Order Items Summary & Payment calculations */}
          <div className="checkout-right-col">
            <div className="checkout-sticky-card">
              <section className="checkout-card-section">
                <h2>Tóm tắt đơn hàng ({checkoutItems.length})</h2>
                <div className="checkout-items-list">
                  {checkoutItems.map(({ product, quantity }) => (
                    <div className="checkout-prod-item" key={product.id}>
                      <img src={product.image} alt={product.name} />
                      <div className="checkout-prod-info">
                        <h3>{product.name}</h3>
                        <p>Dung tích: {product.weight}</p>
                        <span>x{quantity}</span>
                      </div>
                      <span className="checkout-prod-price">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Voucher section */}
              <section className="checkout-card-section voucher-section">
                <h3>Khuyến mãi / Mã giảm giá</h3>
                <div className="voucher-input-group">
                  <input
                    type="text"
                    placeholder="Nhập mã (Ví dụ: REDBEAN50, FREESHIP)"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                  />
                  <button type="button" onClick={handleApplyVoucher}>
                    Áp dụng
                  </button>
                </div>
                {voucherNotice.message && (
                  <p className={`voucher-notice ${voucherNotice.type}`}>{voucherNotice.message}</p>
                )}
                <div className="voucher-suggestions">
                  <p>Mã ưu đãi gợi ý cho bạn:</p>
                  <ul>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setVoucherCode('REDBEAN50')
                          setVoucherNotice({ message: '', type: '' })
                        }}
                      >
                        REDBEAN50
                      </button>
                      <span>- Giảm ngay 50.000đ (cho đơn từ 200k)</span>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setVoucherCode('FREESHIP')
                          setVoucherNotice({ message: '', type: '' })
                        }}
                      >
                        FREESHIP
                      </button>
                      <span>- Miễn phí vận chuyển</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Total calculations */}
              <section className="checkout-card-section summary-invoice">
                <div className="invoice-row">
                  <span>Tạm tính tiền hàng:</span>
                  <span>{formatPrice(totalProductPrice)}</span>
                </div>
                <div className="invoice-row">
                  <span>Phí vận chuyển:</span>
                  {appliedVoucher === 'FREESHIP' ? (
                    <span>
                      <del style={{ marginRight: '6px', color: '#999' }}>
                        {formatPrice(originalShippingFee)}
                      </del>
                      0đ
                    </span>
                  ) : (
                    <span>{formatPrice(shippingFee)}</span>
                  )}
                </div>
                {voucherDiscount > 0 && (
                  <div className="invoice-row discount">
                    <span>Mã giảm giá áp dụng:</span>
                    <span>-{formatPrice(voucherDiscount)}</span>
                  </div>
                )}
                <div className="invoice-row grand-total">
                  <span>Tổng cộng thanh toán:</span>
                  <strong>{formatPrice(totalPayment)}</strong>
                </div>
              </section>

              <button type="submit" className="place-order-submit-btn">
                Xác nhận đặt hàng
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}

export default CheckoutPage
