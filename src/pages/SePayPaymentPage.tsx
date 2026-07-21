import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { api } from '../services/api'
import { getCurrentUser } from '../utils/auth'
import './SePayPaymentPage.css'

interface PaymentInformation {
  orderId: string
  orderCode: string
  amount: number
  paymentCode: string
  paymentStatus: 'CHUA_THANH_TOAN' | 'DA_THANH_TOAN' | 'THAT_BAI' | 'DA_HOAN_TIEN'
  transactionStatus: 'CHO_THANH_TOAN' | 'DA_THANH_TOAN' | 'HET_HAN' | 'DA_HUY'
  paidAt: string | null
  expiresAt: string | null
  bank: {
    code: string
    name: string
    accountNumber: string
    accountHolder: string
  }
  qrUrl: string
}

function SePayPaymentPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [payment, setPayment] = useState<PaymentInformation | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (!getCurrentUser()) {
      navigate('/tai-khoan?che-do=dang-nhap', { replace: true })
      return
    }
    if (!orderId) {
      navigate('/tai-khoan/don-hang', { replace: true })
      return
    }

    let disposed = false
    const loadPayment = async () => {
      try {
        const data = await api.get<PaymentInformation>(`/customers/me/orders/${orderId}/payment`)
        if (!disposed) {
          setPayment(data)
          setError('')
        }
      } catch (requestError) {
        if (!disposed) setError(requestError instanceof Error ? requestError.message : 'Không thể kiểm tra thanh toán.')
      }
    }

    void loadPayment()
    const interval = window.setInterval(() => {
      if (payment?.paymentStatus !== 'DA_THANH_TOAN' && payment?.transactionStatus === 'CHO_THANH_TOAN') void loadPayment()
    }, 4000)
    return () => {
      disposed = true
      window.clearInterval(interval)
    }
  }, [navigate, orderId, payment?.paymentStatus, payment?.transactionStatus])

  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1600)
  }

  const isPaid = payment?.paymentStatus === 'DA_THANH_TOAN'
  const isExpired = payment?.transactionStatus === 'HET_HAN' || payment?.transactionStatus === 'DA_HUY'

  return (
    <main className="sepay-page">
      <div className="sepay-container">
        <div className="sepay-heading">
          <span>THANH TOÁN CHUYỂN KHOẢN</span>
          <h1>{isPaid ? 'Thanh toán thành công' : isExpired ? 'Đã hết hạn thanh toán' : 'Quét mã để thanh toán'}</h1>
          <p>
            {isPaid
              ? 'Giao dịch đã được xác nhận tự động. Cửa hàng sẽ sớm xử lý đơn của bạn.'
              : isExpired
                ? 'Đơn hàng đã được hủy và số lượng giữ chỗ đã được hoàn lại.'
              : 'Mở ứng dụng ngân hàng, quét mã VietQR và giữ nguyên số tiền cùng nội dung chuyển khoản.'}
          </p>
        </div>

        {error && !payment && <div className="sepay-error">{error}</div>}
        {!payment && !error && <div className="sepay-loading">Đang tạo thông tin thanh toán...</div>}

        {payment && (
          <section className={`sepay-card${isPaid ? ' paid' : ''}`}>
            <div className="sepay-qr-column">
              {isPaid ? (
                <div className="sepay-success-icon" aria-hidden="true">✓</div>
              ) : isExpired ? (
                <div className="sepay-success-icon" aria-hidden="true">×</div>
              ) : (
                <img src={payment.qrUrl} alt={`Mã QR thanh toán đơn ${payment.orderCode}`} className="sepay-qr" />
              )}
              <div className={`sepay-status ${isPaid ? 'success' : 'waiting'}`}>
                <span className="status-dot" />
                {isPaid ? 'Đã nhận thanh toán' : isExpired ? 'Giao dịch đã hết hạn' : 'Đang chờ ngân hàng xác nhận'}
              </div>
              {!isPaid && !isExpired && <small>Trạng thái được kiểm tra tự động mỗi 4 giây</small>}
            </div>

            <div className="sepay-details">
              <div className="sepay-order-line">
                <span>Đơn hàng</span>
                <strong>{payment.orderCode}</strong>
              </div>
              <div className="sepay-amount">
                <span>Số tiền cần chuyển</span>
                <strong>{formatPrice(payment.amount)}</strong>
              </div>

              <dl className="sepay-bank-info">
                <div>
                  <dt>Ngân hàng</dt>
                  <dd>{payment.bank.name || payment.bank.code}</dd>
                </div>
                <div>
                  <dt>Số tài khoản</dt>
                  <dd>
                    <strong>{payment.bank.accountNumber}</strong>
                    <button type="button" onClick={() => void copyValue('account', payment.bank.accountNumber)}>
                      {copied === 'account' ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>Chủ tài khoản</dt>
                  <dd>{payment.bank.accountHolder}</dd>
                </div>
                <div className="payment-code-row">
                  <dt>Nội dung chuyển khoản</dt>
                  <dd>
                    <strong>{payment.paymentCode}</strong>
                    <button type="button" onClick={() => void copyValue('code', payment.paymentCode)}>
                      {copied === 'code' ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </dd>
                </div>
              </dl>

              {!isPaid && !isExpired && (
                <div className="sepay-warning">
                  Không sửa số tiền hoặc nội dung chuyển khoản. Hệ thống chỉ xác nhận khi thông tin khớp hoàn toàn.
                </div>
              )}

              <div className="sepay-actions">
                <Link to="/tai-khoan/don-hang" className="sepay-primary-link">Xem đơn hàng</Link>
                {!isPaid && <Link to="/" className="sepay-secondary-link">Thanh toán sau</Link>}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default SePayPaymentPage
