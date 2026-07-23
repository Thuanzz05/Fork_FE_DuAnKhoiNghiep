import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../utils/auth'
import { getCartItems, saveCartItems } from '../utils/cart'
import { formatPrice } from '../data/products'
import { useCatalog } from '../hooks/useCatalog'
import { api } from '../services/api'
import { getStoreSettings, type StoreSettings } from '../utils/storeSettings'
import './CheckoutPage.css'

interface LocationState {
  selectedIds?: string[]
}

interface CreateOrderResponse {
  id: string
  orderCode: string
  paymentRequired: boolean
}

interface CheckoutQuote {
  subtotal: number
  discountAmount: number
  shippingFee: number
  totalPayment: number
  appliedPromotion: { code: string; description: string } | null
  promotions: CheckoutPromotion[]
}

interface CheckoutPromotion {
  code: string
  title: string
  description: string | null
  minimumOrder: number
  type: 'PHAN_TRAM' | 'SO_TIEN' | 'MIEN_PHI_VAN_CHUYEN'
  estimatedSavings?: number
}

type AdministrativeUnit = {
  code: string
  name: string
  type: string
}

type AddressApiResponse = {
  success: boolean
  data: AdministrativeUnit[]
}

const ADDRESS_API_BASE = 'https://tinhthanhpho.com/api/v1'

type CheckoutPaymentMethod = 'COD' | 'CHUYEN_KHOAN'

const getPaymentOptions = (settings: StoreSettings) => {
  const options: Array<{ id: CheckoutPaymentMethod; title: string; desc: string; icon: string; enabled: boolean }> = [
    { id: 'COD', title: 'Thanh toán khi nhận hàng (COD)', desc: 'Thanh toán bằng tiền mặt trực tiếp cho shipper khi nhận được hàng.', icon: '💵', enabled: settings.codEnabled },
    { id: 'CHUYEN_KHOAN', title: 'Chuyển khoản ngân hàng (SePay)', desc: `Quét mã VietQR và tự động xác nhận thanh toán cho ${settings.storeName}.`, icon: '🏦', enabled: settings.bankTransferEnabled },
  ]
  const enabledOptions = options.filter((option) => option.enabled)
  return enabledOptions.length ? enabledOptions : [options[0]]
}

function CheckoutPage() {
  const { products } = useCatalog()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null
  const selectedIds = useMemo(() => state?.selectedIds || [], [state])

  const [user] = useState(() => getCurrentUser())
  const [storeSettings] = useState(() => getStoreSettings())
  const paymentOptions = useMemo(() => getPaymentOptions(storeSettings), [storeSettings])

  // Form states
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [recipientName, setRecipientName] = useState('')
  const [phone, setPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [provinces, setProvinces] = useState<AdministrativeUnit[]>([])
  const [wards, setWards] = useState<AdministrativeUnit[]>([])
  const [provinceCode, setProvinceCode] = useState('')
  const [wardCode, setWardCode] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressApiError, setAddressApiError] = useState('')
  const [wardRetryKey, setWardRetryKey] = useState(0)
  const [useCustomAddress, setUseCustomAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>(() => getPaymentOptions(storeSettings)[0].id)
  const [customerNote, setCustomerNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null)
  const [checkoutQuote, setCheckoutQuote] = useState<CheckoutQuote | null>(null)
  const [voucherNotice, setVoucherNotice] = useState({ message: '', type: '' })
  const [isQuoteLoading, setIsQuoteLoading] = useState(true)
  const [updatingVoucherCode, setUpdatingVoucherCode] = useState<string | null>(null)

  const loadProvinces = async () => {
    setAddressLoading(true)
    setAddressApiError('')
    try {
      const response = await fetch(`${ADDRESS_API_BASE}/new-provinces?limit=100`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Không thể tải tỉnh/thành phố')
      const result = (await response.json()) as AddressApiResponse
      setProvinces(result.data || [])
    } catch {
      setAddressApiError('Không thể tải dữ liệu địa chỉ. Vui lòng thử lại.')
    } finally {
      setAddressLoading(false)
    }
  }

  useEffect(() => {
    void loadProvinces()
  }, [])

  useEffect(() => {
    if (!provinceCode) {
      setWards([])
      setWardCode('')
      return
    }

    const loadWards = async () => {
      setAddressLoading(true)
      setAddressApiError('')
      try {
        const response = await fetch(`${ADDRESS_API_BASE}/new-provinces/${provinceCode}/wards?limit=500`, {
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) throw new Error('Không thể tải phường/xã')
        const result = (await response.json()) as AddressApiResponse
        setWards(result.data || [])
        setWardCode('')
      } catch {
        setWards([])
        setAddressApiError('Không thể tải danh sách phường/xã. Vui lòng thử lại.')
      } finally {
        setAddressLoading(false)
      }
    }

    void loadWards()
  }, [provinceCode, wardRetryKey])

  useEffect(() => {
    if (!useCustomAddress) return
    const province = provinces.find((item) => item.code === provinceCode)
    const ward = wards.find((item) => item.code === wardCode)
    const provinceName = province ? `${province.type} ${province.name}`.trim() : ''
    const wardName = ward ? `${ward.type} ${ward.name}`.trim() : ''
    setShippingAddress([addressDetail.trim(), wardName, provinceName].filter(Boolean).join(', '))
  }, [addressDetail, provinceCode, provinces, useCustomAddress, wardCode, wards])

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
    setProvinceCode('')
    setWardCode('')
    setAddressDetail('')
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
  }, [products, selectedIds])

  const totalProductPrice = checkoutQuote?.subtotal ?? 0
  const voucherDiscount = checkoutQuote?.discountAmount ?? 0
  const shippingFee = checkoutQuote?.shippingFee ?? 0
  const totalPayment = checkoutQuote?.totalPayment ?? 0

  const loadCheckoutQuote = async (promotionCode?: string) => {
    const quote = await api.post<CheckoutQuote>('/customers/me/checkout/quote', {
      productIds: selectedIds,
      promotionCode,
    })
    setCheckoutQuote(quote)
    setAppliedVoucher(quote.appliedPromotion?.code ?? null)
    return quote
  }

  useEffect(() => {
    if (!selectedIds.length) return
    setAppliedVoucher(null)
    setVoucherCode('')
    setVoucherNotice({ message: '', type: '' })
    setIsQuoteLoading(true)
    void api.post<CheckoutQuote>('/customers/me/checkout/quote', { productIds: selectedIds })
      .then(setCheckoutQuote)
      .catch((error) => {
        setCheckoutQuote(null)
        setVoucherNotice({ message: error instanceof Error ? error.message : 'Không thể tính đơn hàng.', type: 'error' })
      })
      .finally(() => setIsQuoteLoading(false))
  }, [selectedIds])

  const applyVoucherCode = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase()
    if (!code) return
    setUpdatingVoucherCode(code)
    setVoucherCode(code)
    try {
      await loadCheckoutQuote(code)
      setVoucherNotice({ message: `Áp dụng mã ${code} thành công!`, type: 'success' })
    } catch (error) {
      setAppliedVoucher(null)
      await loadCheckoutQuote().catch(() => setCheckoutQuote(null))
      setVoucherNotice({ message: error instanceof Error ? error.message : 'Không thể áp dụng mã.', type: 'error' })
    } finally {
      setUpdatingVoucherCode(null)
    }
  }

  const handleApplyVoucher = () => {
    void applyVoucherCode(voucherCode)
  }

  const handleRemoveVoucher = async () => {
    const previousCode = appliedVoucher
    setUpdatingVoucherCode(previousCode || '__REMOVE__')
    try {
      await loadCheckoutQuote()
      setVoucherCode('')
      setVoucherNotice({ message: 'Đã bỏ mã khuyến mại.', type: 'success' })
    } catch (error) {
      setVoucherNotice({ message: error instanceof Error ? error.message : 'Không thể bỏ mã.', type: 'error' })
    } finally {
      setUpdatingVoucherCode(null)
    }
  }

  // Handle Order Submit
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return
    if (checkoutItems.length === 0) return
    if (!checkoutQuote) {
      setVoucherNotice({ message: 'Chưa tải được báo giá từ máy chủ.', type: 'error' })
      return
    }

    if (!recipientName.trim() || !phone.trim() || !shippingAddress.trim()
      || (useCustomAddress && (!provinceCode || !wardCode || !addressDetail.trim()))) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng.')
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const order = await api.post<CreateOrderResponse>('/customers/me/orders', {
        productIds: selectedIds,
        addressId: !useCustomAddress ? selectedAddressId || undefined : undefined,
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        email: user.email,
        shippingAddress: shippingAddress.trim(),
        provinceCode, provinceName: provinces.find((item) => item.code === provinceCode)?.name,
        wardCode, wardName: wards.find((item) => item.code === wardCode)?.name,
        detail: addressDetail.trim(),
        customerNote: customerNote.trim() || undefined,
        paymentMethod,
        promotionCode: appliedVoucher || undefined,
      })
      const cartItems = getCartItems()
      saveCartItems(cartItems.filter((item) => !selectedIds.includes(item.productId)))
      if (order.paymentRequired) {
        navigate(`/thanh-toan/chuyen-khoan/${order.id}`, { replace: true })
      } else {
        navigate('/tai-khoan/don-hang', { replace: true })
      }
    } catch (error) {
      setVoucherNotice({ message: error instanceof Error ? error.message : 'Không thể tạo đơn hàng.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
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

                  <div className="form-group-row">
                    <label className="form-group">
                      <span>Tỉnh/Thành phố *</span>
                      <select
                        value={provinceCode}
                        onChange={(e) => setProvinceCode(e.target.value)}
                        disabled={addressLoading && provinces.length === 0}
                        required
                      >
                        <option value="">Chọn tỉnh/thành phố</option>
                        {provinces.map((item) => (
                          <option value={item.code} key={item.code}>{item.type} {item.name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="form-group">
                      <span>Phường/Xã *</span>
                      <select
                        value={wardCode}
                        onChange={(e) => setWardCode(e.target.value)}
                        disabled={!provinceCode || addressLoading}
                        required
                      >
                        <option value="">Chọn phường/xã</option>
                        {wards.map((item) => (
                          <option value={item.code} key={item.code}>{item.type} {item.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="form-group">
                    <span>Số nhà, tên đường *</span>
                    <input
                      type="text"
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      placeholder="Ví dụ: Số 12, đường Nguyễn Văn A"
                      required
                    />
                  </label>
                  {addressApiError && (
                    <div className="checkout-address-error" role="alert">
                      {addressApiError}
                      <button
                        type="button"
                        onClick={() => provinceCode ? setWardRetryKey((key) => key + 1) : void loadProvinces()}
                      >
                        Thử lại
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Payment Method */}
            <section className="checkout-section">
              <h2>2. Phương thức thanh toán</h2>
              <div className="payment-options">
                {paymentOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`payment-option-card${paymentMethod === option.id ? ' selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === option.id}
                      onChange={() => setPaymentMethod(option.id)}
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
                    placeholder="Nhập mã khuyến mại"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value)
                      setVoucherNotice({ message: '', type: '' })
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return
                      event.preventDefault()
                      handleApplyVoucher()
                    }}
                  />
                  <button type="button" disabled={!voucherCode.trim() || updatingVoucherCode !== null} onClick={handleApplyVoucher}>
                    {updatingVoucherCode ? 'Đang xử lý...' : 'Áp dụng'}
                  </button>
                </div>
                {voucherNotice.message && (
                  <p className={`voucher-notice ${voucherNotice.type}`}>{voucherNotice.message}</p>
                )}
                <div className="voucher-suggestions">
                  <div className="voucher-suggestions-heading"><div><strong>Ưu đãi dùng được cho đơn hàng này</strong><span>{checkoutQuote?.promotions.length ? `${checkoutQuote.promotions.length} mã phù hợp` : 'Hệ thống tự kiểm tra điều kiện'}</span></div></div>
                  {isQuoteLoading ? <p className="voucher-suggestions-empty">Đang tìm ưu đãi phù hợp...</p> : checkoutQuote?.promotions.length ? (
                    <div className="voucher-card-list">
                      {checkoutQuote.promotions.map((promotion, index) => {
                        const isApplied = appliedVoucher === promotion.code
                        const isUpdating = updatingVoucherCode === promotion.code
                        const estimatedSavings = Number(promotion.estimatedSavings) || 0
                        return (
                          <article className={`voucher-card${isApplied ? ' is-applied' : ''}`} key={promotion.code}>
                            <div className="voucher-card-code"><strong>{promotion.code}</strong>{index === 0 && checkoutQuote.promotions.length > 1 ? <span>Tốt nhất</span> : null}</div>
                            <div className="voucher-card-copy"><strong>{promotion.title}</strong><p>{promotion.description || `Áp dụng cho đơn từ ${formatPrice(Number(promotion.minimumOrder) || 0)}`}</p>{estimatedSavings > 0 ? <small>Tiết kiệm {formatPrice(estimatedSavings)}</small> : null}</div>
                            <button type="button" className={isApplied ? 'is-remove' : ''} disabled={updatingVoucherCode !== null} onClick={() => { if (isApplied) void handleRemoveVoucher(); else void applyVoucherCode(promotion.code) }}>{isUpdating ? 'Đang xử lý...' : isApplied ? 'Bỏ mã' : 'Dùng mã'}</button>
                          </article>
                        )
                      })}
                    </div>
                  ) : <p className="voucher-suggestions-empty">Hiện chưa có ưu đãi phù hợp với đơn hàng này.</p>}
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
                  <span>{formatPrice(shippingFee)}</span>
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

              <button type="submit" className="place-order-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo đơn hàng...' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}

export default CheckoutPage
