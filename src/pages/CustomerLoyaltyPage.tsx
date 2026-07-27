import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import CustomerAccountSidebar from '../components/CustomerAccountSidebar'
import { api } from '../services/api'
import { getCurrentUser } from '../utils/auth'
import './CustomerAccountPage.css'
import './CustomerLoyaltyPage.css'

interface LoyaltyData {
  wallet: {
    availableCoins: number
    reservedCoins: number
    pendingRecoveryCoins: number
  }
  member: {
    tierCode: string
    tierName: string
    earningRate: number
    eligibleSpend: number
    nextTier: {
      code: string
      name: string
      minimumSpend: number
      earningRate: number
      remainingSpend: number
    } | null
  }
  transactions: Array<{
    id: string
    type: string
    coins: number
    balanceAfter: number
    content: string
    createdAt: string
  }>
}

const formatNumber = (value: number) => value.toLocaleString('vi-VN')
const formatMoney = (value: number) => `${formatNumber(value)}đ`

const transactionLabels: Record<string, string> = {
  THUONG_DANH_GIA: 'Thưởng đánh giá',
  TICH_LUY_DON_HANG: 'Tích xu đơn hàng',
  HOAN_TAC_DANH_GIA: 'Thu hồi thưởng đánh giá',
  THU_HOI_XU_HOAN_HANG: 'Thu hồi xu hoàn hàng',
  DIEU_CHINH_ADMIN: 'Điều chỉnh',
  DIEM_DANH_HANG_NGAY: 'Điểm danh hằng ngày',
}

function CustomerLoyaltyPage() {
  const user = getCurrentUser()
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    api.get<LoyaltyData>('/customers/me/loyalty')
      .then(setData)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể tải thông tin thành viên.'))
  }, [user])

  if (!user) return <Navigate to="/tai-khoan?che-do=dang-nhap" replace />

  const progress = data?.member.nextTier
    ? Math.min(100, (data.member.eligibleSpend / data.member.nextTier.minimumSpend) * 100)
    : 100

  return (
    <main className="customer-account-page">
      <div className="customer-account-container customer-account-layout">
        <CustomerAccountSidebar user={user} />
        <div className="customer-account-main loyalty-page">
          <header className="loyalty-heading">
            <div><span>RUBEANORA REWARDS</span><h1>Xu và hạng thành viên</h1><p>Tích xu từ đơn hàng và đánh giá đã được duyệt.</p></div>
            {data ? <strong className={`loyalty-tier is-${data.member.tierCode.toLowerCase()}`}>{data.member.tierName}</strong> : null}
          </header>

          {error ? <div className="loyalty-error">{error}</div> : null}
          {!data && !error ? <div className="loyalty-loading">Đang tải thông tin thành viên...</div> : null}

          {data ? (
            <>
              <section className="loyalty-summary">
                <article className="is-coins"><small>Xu khả dụng</small><strong>{formatNumber(data.wallet.availableCoins)}</strong><span>1 xu = 1 đồng</span></article>
                <article><small>Hạng hiện tại</small><strong>{data.member.tierName}</strong><span>Tích xu {(data.member.earningRate * 100).toLocaleString('vi-VN')}% mỗi đơn</span></article>
                <article><small>Chi tiêu hợp lệ</small><strong>{formatMoney(data.member.eligibleSpend)}</strong><span>Dùng để xét hạng thành viên</span></article>
              </section>

              <section className="loyalty-progress-card">
                <div>
                  <h2>{data.member.nextTier ? `Tiến tới hạng ${data.member.nextTier.name}` : 'Bạn đang ở hạng cao nhất'}</h2>
                  <p>{data.member.nextTier
                    ? `Cần thêm ${formatMoney(data.member.nextTier.remainingSpend)} chi tiêu hợp lệ.`
                    : 'Cảm ơn bạn đã đồng hành cùng Rubeanora.'}</p>
                </div>
                <div className="loyalty-progress"><i style={{ width: `${progress}%` }} /></div>
                <div className="loyalty-progress-labels"><span>{formatMoney(data.member.eligibleSpend)}</span><span>{data.member.nextTier ? formatMoney(data.member.nextTier.minimumSpend) : 'Kim cương'}</span></div>
              </section>

              {data.wallet.pendingRecoveryCoins > 0 ? (
                <div className="loyalty-debt">Có {formatNumber(data.wallet.pendingRecoveryCoins)} xu đang chờ thu hồi và sẽ được trừ vào lần tích xu tiếp theo.</div>
              ) : null}

              <section className="loyalty-history">
                <header><div><span>LỊCH SỬ XU</span><h2>Giao dịch gần đây</h2></div><small>{data.transactions.length} giao dịch</small></header>
                {data.transactions.length ? (
                  <div>{data.transactions.map((item) => (
                    <article key={item.id}>
                      <span className={item.coins >= 0 ? 'is-plus' : 'is-minus'}>{item.coins >= 0 ? '+' : ''}{formatNumber(item.coins)}</span>
                      <div><strong>{transactionLabels[item.type] || item.type}</strong><p>{item.content}</p><small>{new Date(item.createdAt).toLocaleString('vi-VN')}</small></div>
                      <em>Số dư: {formatNumber(item.balanceAfter)}</em>
                    </article>
                  ))}</div>
                ) : <p className="loyalty-empty">Bạn chưa có giao dịch xu. Hãy mua hàng hoặc gửi đánh giá để bắt đầu tích xu.</p>}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default CustomerLoyaltyPage
