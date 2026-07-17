import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import Pagination from '../../components/Pagination'
import { getRegisteredUsers, type AuthUser } from '../../utils/auth'
import { getOrders } from '../../utils/orders'
import { formatPrice } from '../../data/products'
import { usePagination } from '../../hooks/usePagination'
import { api } from '../../services/api'
import './AdminAccountsPage.css'

type AccountRole = 'admin' | 'staff' | 'customer'
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

interface AccountFormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: AccountRole
  status: AccountStatus
  password: string
  avatar: string
}

const roleMeta: Record<AccountRole, { label: string }> = {
  admin: { label: 'Quản trị viên' },
  staff: { label: 'Nhân viên' },
  customer: { label: 'Khách hàng' },
}

const statusMeta: Record<AccountStatus, { label: string }> = {
  active: { label: 'Hoạt động' },
  locked: { label: 'Đã khóa' },
}

const seedAccounts: ManagedAccount[] = [
  { id: 'admin-001', firstName: 'Trị viên', lastName: 'Quản', email: 'admin@rubeanora.vn', phone: '0986126955', addressCount: 0, role: 'admin', status: 'active', orderCount: 0, totalSpent: 0, joinedAt: '2026-01-08T08:00:00.000Z', lastActive: 'Vừa xong' },
  { id: 'user-quang-demo', firstName: 'Quang', lastName: 'Lê Văn', email: 'quang@gmail.com', phone: '0987654321', addressCount: 1, role: 'customer', status: 'active', orderCount: 3, totalSpent: 1340000, joinedAt: '2026-06-18T09:15:00.000Z', lastActive: '12 phút trước' },
  { id: 'staff-001', firstName: 'Hương', lastName: 'Nguyễn Thu', email: 'huong@rubeanora.vn', phone: '0974286315', addressCount: 0, role: 'staff', status: 'active', orderCount: 0, totalSpent: 0, joinedAt: '2026-03-12T03:20:00.000Z', lastActive: '1 giờ trước' },
  { id: 'customer-001', firstName: 'Anh', lastName: 'Nguyễn Minh', email: 'minhanh@gmail.com', phone: '0912456780', addressCount: 2, role: 'customer', status: 'active', orderCount: 8, totalSpent: 3280000, joinedAt: '2026-07-10T02:40:00.000Z', lastActive: 'Hôm nay, 14:35' },
  { id: 'customer-002', firstName: 'Trang', lastName: 'Lê Thu', email: 'thutrang@gmail.com', phone: '0386921754', addressCount: 1, role: 'customer', status: 'active', orderCount: 5, totalSpent: 2150000, joinedAt: '2026-07-04T10:05:00.000Z', lastActive: 'Hôm qua, 20:18' },
  { id: 'customer-003', firstName: 'Bảo', lastName: 'Phạm Quốc', email: 'quocbao@gmail.com', phone: '0963847120', addressCount: 1, role: 'customer', status: 'locked', orderCount: 2, totalSpent: 700000, joinedAt: '2026-05-22T07:50:00.000Z', lastActive: '05/07/2026' },
  { id: 'customer-004', firstName: 'Hà', lastName: 'Vũ Ngọc', email: 'ngocha@gmail.com', phone: '0325678419', addressCount: 3, role: 'customer', status: 'active', orderCount: 11, totalSpent: 4960000, joinedAt: '2026-04-16T13:25:00.000Z', lastActive: 'Hôm nay, 09:42' },
  { id: 'customer-005', firstName: 'Huy', lastName: 'Trần Quang', email: 'quanghuy@gmail.com', phone: '0903147258', addressCount: 1, role: 'customer', status: 'active', orderCount: 4, totalSpent: 1810000, joinedAt: '2026-07-12T04:12:00.000Z', lastActive: 'Hôm nay, 13:10' },
]

const emptyForm: AccountFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'customer',
  status: 'active',
  password: '',
  avatar: '',
}

const getFullName = (account: Pick<ManagedAccount, 'firstName' | 'lastName'>) => `${account.lastName} ${account.firstName}`.trim()

const getInitials = (account: Pick<ManagedAccount, 'firstName' | 'lastName' | 'email'>) => {
  const words = `${account.lastName} ${account.firstName}`.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return account.email.charAt(0).toLocaleUpperCase('vi-VN')
  return `${words[0].charAt(0)}${words.at(-1)?.charAt(0) ?? ''}`.toLocaleUpperCase('vi-VN')
}

const getJoinedAtFromUser = (user: AuthUser) => {
  const timestamp = Number(user.id.match(/\d{12,}/)?.[0])
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '2026-06-01T08:00:00.000Z'
}

const buildInitialAccounts = (): ManagedAccount[] => {
  const accounts = seedAccounts.map((account) => ({ ...account }))
  const orders = getOrders()

  getRegisteredUsers().forEach((user) => {
    const userOrders = orders.filter((order) => order.userId === user.id)
    const orderCount = userOrders.length
    const totalSpent = userOrders.reduce((total, order) => total + order.totalPayment, 0)
    const existingIndex = accounts.findIndex((account) => account.email.toLocaleLowerCase('vi-VN') === user.email.toLocaleLowerCase('vi-VN'))

    if (existingIndex >= 0) {
      accounts[existingIndex] = {
        ...accounts[existingIndex],
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        addressCount: user.addresses.length,
        orderCount: orderCount || accounts[existingIndex].orderCount,
        totalSpent: totalSpent || accounts[existingIndex].totalSpent,
      }
      return
    }

    accounts.push({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      addressCount: user.addresses.length,
      role: 'customer',
      status: 'active',
      orderCount,
      totalSpent,
      joinedAt: getJoinedAtFromUser(user),
      lastActive: 'Gần đây',
    })
  })

  return accounts
}

function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<ManagedAccount[]>(buildInitialAccounts)

  const loadAccounts = async () => {
    try {
      const data = await api.get<{ items: Array<{
        id: string; fullName: string; email: string; phone?: string; avatar?: string
        role: 'ADMIN' | 'KHACH_HANG'; status: 'HOAT_DONG' | 'BI_KHOA'
        orderCount: number; spending: number; createdAt: string
      }> }>('/admin/users?limit=100')
      if (data.items.length) setAccounts(data.items.map((item) => {
        const names = item.fullName.trim().split(/\s+/)
        return {
          id: item.id, firstName: names.pop() || '', lastName: names.join(' '), email: item.email,
          phone: item.phone || '', avatar: item.avatar, addressCount: 0,
          role: item.role === 'ADMIN' ? 'admin' : 'customer',
          status: item.status === 'HOAT_DONG' ? 'active' : 'locked',
          orderCount: item.orderCount, totalSpent: item.spending, joinedAt: item.createdAt, lastActive: 'Gần đây',
        }
      }))
    } catch {
      // Giữ dữ liệu dự phòng.
    }
  }

  useEffect(() => { void loadAccounts() }, [])
  const [searchValue, setSearchValue] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | AccountRole>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all')
  const [sortBy, setSortBy] = useState<AccountSort>('newest')
  const [editingAccount, setEditingAccount] = useState<ManagedAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<ManagedAccount | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<AccountFormState>(emptyForm)
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!isFormOpen && !deletingAccount) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFormOpen(false)
        setDeletingAccount(null)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [deletingAccount, isFormOpen])

  const filteredAccounts = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase('vi-VN')
    const result = accounts.filter((account) => {
      const matchesKeyword = !keyword || [getFullName(account), account.email, account.phone, account.id]
        .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
      const matchesRole = roleFilter === 'all' || account.role === roleFilter
      const matchesStatus = statusFilter === 'all' || account.status === statusFilter
      return matchesKeyword && matchesRole && matchesStatus
    })

    return result.sort((first, second) => {
      if (sortBy === 'name') return getFullName(first).localeCompare(getFullName(second), 'vi')
      if (sortBy === 'spending') return second.totalSpent - first.totalSpent
      return new Date(second.joinedAt).getTime() - new Date(first.joinedAt).getTime()
    })
  }, [accounts, roleFilter, searchValue, sortBy, statusFilter])

  const { currentPage, totalPages, pageItems: paginatedAccounts, setCurrentPage } = usePagination(
    filteredAccounts,
    6,
    `${searchValue}|${roleFilter}|${statusFilter}|${sortBy}`,
  )

  const activeCount = accounts.filter((account) => account.status === 'active').length
  const lockedCount = accounts.filter((account) => account.status === 'locked').length
  const staffCount = accounts.filter((account) => account.role === 'staff' || account.role === 'admin').length

  const openCreateForm = () => {
    setEditingAccount(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEditForm = (account: ManagedAccount) => {
    setEditingAccount(account)
    setForm({
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      phone: account.phone,
      role: account.role,
      status: account.status,
      password: '',
      avatar: account.avatar ?? '',
    })
    setIsFormOpen(true)
  }

  const updateField = <K extends keyof AccountFormState>(field: K, value: AccountFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = form.email.trim().toLocaleLowerCase('vi-VN')
    const duplicatedEmail = accounts.some((account) => account.email.toLocaleLowerCase('vi-VN') === normalizedEmail && account.id !== editingAccount?.id)

    if (duplicatedEmail) {
      setNotice({ text: 'Email này đã được sử dụng bởi tài khoản khác', type: 'error' })
      return
    }

    if (!editingAccount) {
      setNotice({ text: 'Backend hiện chưa hỗ trợ admin tạo tài khoản trực tiếp', type: 'error' })
      return
    }
    try {
      await api.patch(`/admin/users/${editingAccount.id}`, {
        role: form.role === 'admin' ? 'ADMIN' : 'KHACH_HANG',
        status: form.status === 'active' ? 'HOAT_DONG' : 'BI_KHOA',
      })
      await loadAccounts()
      setNotice({ text: 'Đã cập nhật quyền và trạng thái tài khoản', type: 'success' })
      setIsFormOpen(false)
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Không thể cập nhật tài khoản', type: 'error' })
    }
  }

  const toggleAccountStatus = async (account: ManagedAccount) => {
    if (account.role === 'admin') return
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
    if (!deletingAccount || deletingAccount.role === 'admin') return
    await toggleAccountStatus(deletingAccount)
    setDeletingAccount(null)
  }

  return (
    <AdminLayout
      activeItem="accounts"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder="Tìm tên, email hoặc số điện thoại..."
    >
      <div className="admin-page-heading admin-accounts-heading">
        <div>
          <p>QUẢN LÝ NGƯỜI DÙNG</p>
          <h1>Quản lý tài khoản</h1>
          <span>Theo dõi khách hàng, nhân viên và quyền truy cập hệ thống.</span>
        </div>
        <button type="button" className="admin-account-primary" onClick={openCreateForm}><AdminIcon name="userPlus" />Thêm tài khoản</button>
      </div>

      <section className="admin-account-summary" aria-label="Tổng quan tài khoản">
        <article><span className="is-red"><AdminIcon name="customers" /></span><div><small>Tổng tài khoản</small><strong>{accounts.length}</strong></div></article>
        <article><span className="is-green"><AdminIcon name="userPlus" /></span><div><small>Đang hoạt động</small><strong>{activeCount}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="settings" /></span><div><small>Quản trị & nhân viên</small><strong>{staffCount}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="lock" /></span><div><small>Tài khoản bị khóa</small><strong>{lockedCount}</strong></div></article>
      </section>

      <section className="admin-accounts-panel">
        <div className="admin-accounts-toolbar">
          <div>
            <label><span>Vai trò</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as 'all' | AccountRole)} aria-label="Lọc theo vai trò"><option value="all">Tất cả vai trò</option><option value="customer">Khách hàng</option><option value="staff">Nhân viên</option><option value="admin">Quản trị viên</option></select></label>
            <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | AccountStatus)} aria-label="Lọc theo trạng thái"><option value="all">Tất cả trạng thái</option><option value="active">Hoạt động</option><option value="locked">Đã khóa</option></select></label>
            <label><span>Sắp xếp</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as AccountSort)} aria-label="Sắp xếp tài khoản"><option value="newest">Mới đăng ký</option><option value="name">Theo tên A-Z</option><option value="spending">Chi tiêu cao nhất</option></select></label>
          </div>
          <span>Hiển thị <strong>{filteredAccounts.length}</strong> / {accounts.length} tài khoản</span>
        </div>

        <div className="admin-accounts-table-wrap">
          <table className="admin-accounts-table">
            <thead><tr><th>Tài khoản</th><th>Điện thoại</th><th>Vai trò</th><th>Đơn hàng</th><th>Địa chỉ</th><th>Ngày tham gia</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {paginatedAccounts.map((account) => (
                <tr key={account.id}>
                  <td><div className="admin-account-cell"><span className={`admin-account-avatar is-${account.role}`}>{account.avatar ? <img src={account.avatar} alt="" /> : getInitials(account)}</span><div><strong>{getFullName(account)}</strong><span>{account.email}</span><small>Hoạt động: {account.lastActive}</small></div></div></td>
                  <td>{account.phone || <span className="admin-account-empty">Chưa cập nhật</span>}</td>
                  <td><span className={`admin-account-role is-${account.role}`}>{roleMeta[account.role].label}</span></td>
                  <td><div className="admin-account-orders"><strong>{account.orderCount} đơn</strong><span>{formatPrice(account.totalSpent)}</span></div></td>
                  <td>{account.addressCount} địa chỉ</td>
                  <td>{new Date(account.joinedAt).toLocaleDateString('vi-VN')}</td>
                  <td><span className={`admin-account-status is-${account.status}`}><i />{statusMeta[account.status].label}</span></td>
                  <td><div className="admin-account-actions"><button type="button" onClick={() => openEditForm(account)} aria-label={`Sửa ${getFullName(account)}`} title="Sửa tài khoản"><AdminIcon name="edit" /></button><button type="button" disabled={account.role === 'admin'} onClick={() => toggleAccountStatus(account)} aria-label={`${account.status === 'active' ? 'Khóa' : 'Mở khóa'} ${getFullName(account)}`} title={account.role === 'admin' ? 'Không thể khóa quản trị viên chính' : account.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}><AdminIcon name={account.status === 'active' ? 'lock' : 'unlock'} /></button><button type="button" className="is-danger" disabled={account.role === 'admin'} onClick={() => setDeletingAccount(account)} aria-label={`Xóa ${getFullName(account)}`} title={account.role === 'admin' ? 'Không thể xóa quản trị viên chính' : 'Xóa tài khoản'}><AdminIcon name="trash" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAccounts.length === 0 ? <div className="admin-accounts-empty"><AdminIcon name="search" /><strong>Không tìm thấy tài khoản</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredAccounts.length} pageSize={6} itemLabel="tài khoản" onPageChange={setCurrentPage} />
      </section>

      {isFormOpen ? (
        <div className="admin-account-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsFormOpen(false)}>
          <section className="admin-account-modal" role="dialog" aria-modal="true" aria-labelledby="admin-account-modal-title">
            <header><div><span>{editingAccount ? editingAccount.id : 'TÀI KHOẢN MỚI'}</span><h2 id="admin-account-modal-title">{editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản'}</h2></div><button type="button" onClick={() => setIsFormOpen(false)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <form onSubmit={handleSubmit}>
              <div className="admin-account-form-grid">
                <label><span>Họ và tên đệm *</span><input required value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} /></label>
                <label><span>Tên *</span><input required value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} /></label>
                <label><span>Email *</span><input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} /></label>
                <label><span>Số điện thoại *</span><input required type="tel" pattern="[0-9]{9,11}" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></label>
                <label><span>Vai trò *</span><select value={form.role} onChange={(event) => updateField('role', event.target.value as AccountRole)}><option value="customer">Khách hàng</option><option value="staff">Nhân viên</option><option value="admin">Quản trị viên</option></select></label>
                <label><span>Trạng thái *</span><select value={form.status} onChange={(event) => updateField('status', event.target.value as AccountStatus)}><option value="active">Hoạt động</option><option value="locked">Đã khóa</option></select></label>
                {!editingAccount ? <label className="is-wide"><span>Mật khẩu tạm thời *</span><input required type="password" minLength={6} value={form.password} onChange={(event) => updateField('password', event.target.value)} /></label> : null}
                <label className="is-wide"><span>Đường dẫn avatar</span><input placeholder="Để trống để dùng avatar chữ cái" value={form.avatar} onChange={(event) => updateField('avatar', event.target.value)} /></label>
              </div>
              <footer><button type="button" className="admin-account-secondary" onClick={() => setIsFormOpen(false)}>Hủy</button><button type="submit" className="admin-account-primary">{editingAccount ? 'Lưu thay đổi' : 'Tạo tài khoản'}</button></footer>
            </form>
          </section>
        </div>
      ) : null}

      {deletingAccount ? (
        <div className="admin-account-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDeletingAccount(null)}>
          <section className="admin-account-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="admin-account-delete-title"><span><AdminIcon name="trash" /></span><h2 id="admin-account-delete-title">Xóa tài khoản?</h2><p>Bạn sắp xóa tài khoản <strong>{getFullName(deletingAccount)}</strong> ({deletingAccount.email}). Thao tác này chỉ áp dụng tạm thời trên frontend.</p><div><button type="button" className="admin-account-secondary" onClick={() => setDeletingAccount(null)}>Hủy</button><button type="button" className="admin-account-danger" onClick={confirmDelete}>Xóa tài khoản</button></div></section>
        </div>
      ) : null}

      {notice ? <div className={`admin-account-toast is-${notice.type}`} role="status"><span>{notice.type === 'success' ? '✓' : '!'}</span>{notice.text}</div> : null}
    </AdminLayout>
  )
}

export default AdminAccountsPage
