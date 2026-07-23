import { useEffect, useMemo, useState } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import Pagination from '../../components/Pagination'
import { formatPrice } from '../../data/products'
import { usePagination } from '../../hooks/usePagination'
import { api } from '../../services/api'
import './AdminAccountsPage.css'

type AccountRole = 'admin' | 'customer'
type AccountStatus = 'active' | 'locked'
type AccountSort = 'newest' | 'name' | 'spending'

interface ManagedAccount {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar?: string
  addressCount: number
  role: AccountRole
  status: AccountStatus
  orderCount: number
  totalSpent: number
  joinedAt: string
  lastActive: string
}

interface AccountDetail {
  id: string
  fullName: string
  email: string
  phone?: string
  avatar?: string
  linkedGoogle: boolean
  birthDate?: string
  gender?: 'NAM' | 'NU' | 'KHAC'
  role: 'ADMIN' | 'KHACH_HANG'
  status: 'HOAT_DONG' | 'BI_KHOA'
  orderCount: number
  spending: number
  createdAt: string
  updatedAt: string
  addresses: Array<{
    id: string
    recipientName: string
    phone: string
    address: string
    isDefault: boolean
  }>
  recentOrders: Array<{
    id: string
    orderCode: string
    total: number
    paymentMethod: string
    paymentStatus: string
    orderStatus: string
    createdAt: string
  }>
}

const roleMeta: Record<AccountRole, { label: string }> = {
  admin: { label: 'Quản trị viên' },
  customer: { label: 'Khách hàng' },
}

const statusMeta: Record<AccountStatus, { label: string }> = {
  active: { label: 'Hoạt động' },
  locked: { label: 'Đã khóa' },
}

const orderStatusLabel: Record<string, string> = {
  CHO_XAC_NHAN: 'Chờ xác nhận',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_CHUAN_BI: 'Đang chuẩn bị',
  DANG_GIAO: 'Đang giao',
  DA_GIAO: 'Đã giao',
  DA_HUY: 'Đã hủy',
}

const paymentMethodLabel: Record<string, string> = {
  COD: 'COD',
  CHUYEN_KHOAN: 'Chuyển khoản',
  MOMO: 'MoMo',
  VNPAY: 'VNPay',
}

const genderLabel: Record<string, string> = { NAM: 'Nam', NU: 'Nữ', KHAC: 'Khác' }
const getFullName = (account: Pick<ManagedAccount, 'firstName' | 'lastName'>) => `${account.lastName} ${account.firstName}`.trim()

const getInitials = (account: Pick<ManagedAccount, 'firstName' | 'lastName' | 'email'>) => {
  const words = `${account.lastName} ${account.firstName}`.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return account.email.charAt(0).toLocaleUpperCase('vi-VN')
  return `${words[0].charAt(0)}${words.at(-1)?.charAt(0) ?? ''}`.toLocaleUpperCase('vi-VN')
}

const formatDateTime = (value?: string) => value
  ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
  : 'Chưa có dữ liệu'

function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all')
  const [sortBy, setSortBy] = useState<AccountSort>('newest')
  const [selectedAccount, setSelectedAccount] = useState<ManagedAccount | null>(null)
  const [accountDetail, setAccountDetail] = useState<AccountDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [deletingAccount, setDeletingAccount] = useState<ManagedAccount | null>(null)
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const loadAccounts = async () => {
    try {
      type AdminUserRow = {
        id: string; fullName: string; email: string; phone?: string; avatar?: string
        role: 'ADMIN' | 'KHACH_HANG'; status: 'HOAT_DONG' | 'BI_KHOA'
        orderCount: number; spending: number; addressCount?: number; createdAt: string; lastActiveAt?: string
      }
      type AdminUsersResponse = { items: AdminUserRow[]; pagination: { totalPages: number } }
      const firstPage = await api.get<AdminUsersResponse>('/admin/users?page=1&limit=100')
      const otherPages = await Promise.all(Array.from(
        { length: Math.max(firstPage.pagination.totalPages - 1, 0) },
        (_, index) => api.get<AdminUsersResponse>(`/admin/users?page=${index + 2}&limit=100`),
      ))
      const items = [firstPage, ...otherPages].flatMap((page) => page.items)
      setAccounts(items.filter((item) => item.role === 'KHACH_HANG').map((item) => {
        const names = item.fullName.trim().split(/\s+/)
        return {
          id: item.id, firstName: names.pop() || '', lastName: names.join(' '), email: item.email,
          phone: item.phone || '', avatar: item.avatar, addressCount: Number(item.addressCount || 0),
          role: 'customer', status: item.status === 'HOAT_DONG' ? 'active' : 'locked',
          orderCount: item.orderCount, totalSpent: item.spending, joinedAt: item.createdAt,
          lastActive: item.lastActiveAt || item.createdAt,
        }
      }))
    } catch {
      setAccounts([])
    }
  }

  useEffect(() => { void loadAccounts() }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!selectedAccount && !deletingAccount) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedAccount(null)
        setDeletingAccount(null)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [deletingAccount, selectedAccount])

  const filteredAccounts = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase('vi-VN')
    const result = accounts.filter((account) => {
      const matchesKeyword = !keyword || [getFullName(account), account.email, account.phone, account.id]
        .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
      return matchesKeyword && (statusFilter === 'all' || account.status === statusFilter)
    })
    return result.sort((first, second) => {
      if (sortBy === 'name') return getFullName(first).localeCompare(getFullName(second), 'vi')
      if (sortBy === 'spending') return second.totalSpent - first.totalSpent
      return new Date(second.joinedAt).getTime() - new Date(first.joinedAt).getTime()
    })
  }, [accounts, searchValue, sortBy, statusFilter])

  const { currentPage, totalPages, pageItems: paginatedAccounts, setCurrentPage } = usePagination(
    filteredAccounts, 6, `${searchValue}|${statusFilter}|${sortBy}`,
  )

  const activeCount = accounts.filter((account) => account.status === 'active').length
  const lockedCount = accounts.filter((account) => account.status === 'locked').length
  const totalSpending = accounts.reduce((sum, account) => sum + account.totalSpent, 0)

  const openAccountDetail = async (account: ManagedAccount) => {
    setSelectedAccount(account)
    setAccountDetail(null)
    setDetailError('')
    setDetailLoading(true)
    try {
      setAccountDetail(await api.get<AccountDetail>(`/admin/users/${account.id}`))
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : 'Không thể tải chi tiết tài khoản')
    } finally {
      setDetailLoading(false)
    }
  }

  const toggleAccountStatus = async (account: ManagedAccount) => {
    const nextStatus: AccountStatus = account.status === 'active' ? 'locked' : 'active'
    try {
      await api.patch(`/admin/users/${account.id}`, { status: nextStatus === 'locked' ? 'BI_KHOA' : 'HOAT_DONG' })
      await loadAccounts()
      setNotice({ text: nextStatus === 'locked' ? `Đã khóa tài khoản ${getFullName(account)}` : `Đã mở khóa tài khoản ${getFullName(account)}`, type: 'success' })
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Không thể cập nhật tài khoản', type: 'error' })
    }
  }

  const confirmDelete = async () => {
    if (!deletingAccount) return
    try {
      await api.delete(`/admin/users/${deletingAccount.id}`)
      await loadAccounts()
      setNotice({ text: `Đã xóa tài khoản ${getFullName(deletingAccount)}`, type: 'success' })
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Không thể xóa tài khoản', type: 'error' })
    } finally {
      setDeletingAccount(null)
    }
  }

  return (
    <AdminLayout activeItem="accounts" searchValue={searchValue} onSearchChange={setSearchValue} searchPlaceholder="Tìm tên, email hoặc số điện thoại...">
      <div className="admin-page-heading admin-accounts-heading"><div><p>QUẢN LÝ NGƯỜI DÙNG</p><h1>Quản lý khách hàng</h1><span>Theo dõi và quản lý thông tin tài khoản khách hàng của hệ thống.</span></div></div>

      <section className="admin-account-summary" aria-label="Tổng quan tài khoản">
        <article><span className="is-red"><AdminIcon name="customers" /></span><div><small>Tổng khách hàng</small><strong>{accounts.length}</strong></div></article>
        <article><span className="is-green"><AdminIcon name="userPlus" /></span><div><small>Đang hoạt động</small><strong>{activeCount}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="products" /></span><div><small>Tổng chi tiêu</small><strong>{formatPrice(totalSpending)}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="lock" /></span><div><small>Tài khoản bị khóa</small><strong>{lockedCount}</strong></div></article>
      </section>

      <section className="admin-accounts-panel">
        <div className="admin-accounts-toolbar"><div>
          <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | AccountStatus)}><option value="all">Tất cả trạng thái</option><option value="active">Hoạt động</option><option value="locked">Đã khóa</option></select></label>
          <label><span>Sắp xếp</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as AccountSort)}><option value="newest">Mới đăng ký</option><option value="name">Theo tên A-Z</option><option value="spending">Chi tiêu cao nhất</option></select></label>
        </div><span>Hiển thị <strong>{filteredAccounts.length}</strong> / {accounts.length} khách hàng</span></div>

        <div className="admin-accounts-table-wrap"><table className="admin-accounts-table">
          <thead><tr><th>STT</th><th>Tài khoản</th><th>Điện thoại</th><th>Vai trò</th><th>Đơn hàng</th><th>Địa chỉ</th><th>Ngày tham gia</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>{paginatedAccounts.map((account, index) => <tr key={account.id}>
            <td><span className="admin-account-order">{(currentPage - 1) * 6 + index + 1}</span></td>
            <td><div className="admin-account-cell"><span className={`admin-account-avatar is-${account.role}`}>{account.avatar ? <img src={account.avatar} alt="" /> : getInitials(account)}</span><div><strong>{getFullName(account)}</strong><span>{account.email}</span><small>Cập nhật: {formatDateTime(account.lastActive)}</small></div></div></td>
            <td>{account.phone || <span className="admin-account-empty">Chưa cập nhật</span>}</td>
            <td><span className={`admin-account-role is-${account.role}`}>{roleMeta[account.role].label}</span></td>
            <td><div className="admin-account-orders"><strong>{account.orderCount} đơn</strong><span>{formatPrice(account.totalSpent)}</span></div></td>
            <td>{account.addressCount} địa chỉ</td>
            <td>{new Date(account.joinedAt).toLocaleDateString('vi-VN')}</td>
            <td><span className={`admin-account-status is-${account.status}`}><i />{statusMeta[account.status].label}</span></td>
            <td><div className="admin-account-actions"><button type="button" onClick={() => void openAccountDetail(account)} aria-label={`Xem ${getFullName(account)}`} title="Xem chi tiết tài khoản"><AdminIcon name="eye" /></button><button type="button" onClick={() => void toggleAccountStatus(account)} title={account.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}><AdminIcon name={account.status === 'active' ? 'lock' : 'unlock'} /></button><button type="button" className="is-danger" onClick={() => setDeletingAccount(account)} title="Xóa tài khoản"><AdminIcon name="trash" /></button></div></td>
          </tr>)}</tbody>
        </table>{filteredAccounts.length === 0 ? <div className="admin-accounts-empty"><AdminIcon name="search" /><strong>Không tìm thấy khách hàng</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}</div>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAccounts.length} pageSize={6} itemLabel="khách hàng" onPageChange={setCurrentPage} />
      </section>

      {selectedAccount ? <div className="admin-account-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedAccount(null)}>
        <section className="admin-account-modal admin-account-detail-modal" role="dialog" aria-modal="true" aria-labelledby="admin-account-modal-title">
          <header><div><span>HỒ SƠ KHÁCH HÀNG</span><h2 id="admin-account-modal-title">Chi tiết tài khoản</h2></div><button type="button" onClick={() => setSelectedAccount(null)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
          {detailLoading ? <div className="admin-account-detail-state"><span className="admin-account-detail-spinner" /><strong>Đang tải thông tin...</strong></div> : null}
          {!detailLoading && detailError ? <div className="admin-account-detail-state is-error"><AdminIcon name="customers" /><strong>Không thể tải hồ sơ</strong><p>{detailError}</p><button type="button" onClick={() => void openAccountDetail(selectedAccount)}>Thử lại</button></div> : null}
          {!detailLoading && accountDetail ? <div className="admin-account-detail-body">
            <section className="admin-account-detail-profile">
              <span className="admin-account-detail-avatar">{accountDetail.avatar ? <img src={accountDetail.avatar} alt="" /> : getInitials(selectedAccount)}</span>
              <div><h3>{accountDetail.fullName}</h3><p>{accountDetail.email}</p><div><span className="admin-account-role is-customer">Khách hàng</span><span className={`admin-account-status is-${accountDetail.status === 'HOAT_DONG' ? 'active' : 'locked'}`}><i />{accountDetail.status === 'HOAT_DONG' ? 'Hoạt động' : 'Đã khóa'}</span>{accountDetail.linkedGoogle ? <span className="admin-account-google">Đã liên kết Google</span> : null}</div></div>
            </section>
            <section className="admin-account-detail-stats">
              <article><small>Tổng đơn hàng</small><strong>{accountDetail.orderCount}</strong></article>
              <article><small>Tổng chi tiêu</small><strong>{formatPrice(accountDetail.spending)}</strong></article>
              <article><small>Sổ địa chỉ</small><strong>{accountDetail.addresses.length}</strong></article>
              <article><small>Ngày tham gia</small><strong>{new Date(accountDetail.createdAt).toLocaleDateString('vi-VN')}</strong></article>
            </section>
            <section className="admin-account-detail-section"><h3>Thông tin cá nhân</h3><div className="admin-account-detail-info">
              <p><span>Họ và tên</span><strong>{accountDetail.fullName}</strong></p><p><span>Email đăng nhập</span><strong>{accountDetail.email}</strong></p>
              <p><span>Số điện thoại</span><strong>{accountDetail.phone || 'Chưa cập nhật'}</strong></p><p><span>Ngày sinh</span><strong>{accountDetail.birthDate ? new Date(accountDetail.birthDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</strong></p>
              <p><span>Giới tính</span><strong>{accountDetail.gender ? genderLabel[accountDetail.gender] : 'Chưa cập nhật'}</strong></p><p><span>Cập nhật gần nhất</span><strong>{formatDateTime(accountDetail.updatedAt)}</strong></p>
            </div></section>
            <section className="admin-account-detail-section"><h3>Địa chỉ nhận hàng ({accountDetail.addresses.length})</h3>{accountDetail.addresses.length ? <div className="admin-account-addresses">{accountDetail.addresses.map((address) => <article key={address.id}><div><strong>{address.recipientName}</strong>{address.isDefault ? <span>Mặc định</span> : null}</div><p>{address.phone}</p><p>{address.address}</p></article>)}</div> : <p className="admin-account-detail-empty">Khách hàng chưa lưu địa chỉ nhận hàng.</p>}</section>
            <section className="admin-account-detail-section"><h3>Đơn hàng gần đây</h3>{accountDetail.recentOrders.length ? <div className="admin-account-recent-orders">{accountDetail.recentOrders.map((order) => <article key={order.id}><div><strong>{order.orderCode}</strong><span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span></div><div><b>{formatPrice(order.total)}</b><span>{paymentMethodLabel[order.paymentMethod] || order.paymentMethod}</span><em className={`is-${order.orderStatus.toLocaleLowerCase()}`}>{orderStatusLabel[order.orderStatus] || order.orderStatus}</em></div></article>)}</div> : <p className="admin-account-detail-empty">Khách hàng chưa phát sinh đơn hàng.</p>}</section>
          </div> : null}
        </section>
      </div> : null}

      {deletingAccount ? <div className="admin-account-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDeletingAccount(null)}><section className="admin-account-delete-modal" role="alertdialog" aria-modal="true"><span><AdminIcon name="trash" /></span><h2>Xóa tài khoản?</h2><p>Bạn sắp xóa tài khoản <strong>{getFullName(deletingAccount)}</strong> ({deletingAccount.email}).</p><div><button type="button" className="admin-account-secondary" onClick={() => setDeletingAccount(null)}>Hủy</button><button type="button" className="admin-account-danger" onClick={() => void confirmDelete()}>Xóa tài khoản</button></div></section></div> : null}
      {notice ? <div className={`admin-account-toast is-${notice.type}`} role="status"><span>{notice.type === 'success' ? '✓' : '!'}</span>{notice.text}</div> : null}
    </AdminLayout>
  )
}

export default AdminAccountsPage
