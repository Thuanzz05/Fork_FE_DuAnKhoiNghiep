import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import Pagination from '../../components/Pagination'
import { formatPrice } from '../../data/products'
import { usePagination } from '../../hooks/usePagination'
import { api } from '../../services/api'
import './AdminPromotionsPage.css'

type PromotionType = 'percentage' | 'fixed' | 'shipping'
type PromotionStatus = 'active' | 'scheduled' | 'expired' | 'disabled' | 'ended'
type BackendPromotionStatus = 'HOAT_DONG' | 'TAM_DUNG' | 'HET_HAN'
type PromotionSort = 'newest' | 'ending' | 'usage' | 'code'

interface Promotion {
  id: string
  code: string
  name: string
  description: string
  type: PromotionType
  value: number
  minimumOrder: number
  maximumDiscount?: number
  usageLimit: number
  usedCount: number
  startDate: string
  endDate: string
  enabled: boolean
  backendStatus: BackendPromotionStatus
}

interface PromotionFormState {
  code: string
  name: string
  description: string
  type: PromotionType
  value: string
  minimumOrder: string
  maximumDiscount: string
  usageLimit: string
  startDate: string
  endDate: string
  enabled: boolean
}

const promotionTypes: Record<PromotionType, { label: string }> = {
  percentage: { label: 'Giảm theo %' },
  fixed: { label: 'Giảm tiền mặt' },
  shipping: { label: 'Miễn phí vận chuyển' },
}

const promotionStatuses: Record<PromotionStatus, { label: string }> = {
  active: { label: 'Đang diễn ra' },
  scheduled: { label: 'Sắp diễn ra' },
  expired: { label: 'Đã hết hạn' },
  disabled: { label: 'Đã tắt' },
  ended: { label: 'Đã kết thúc' },
}

const emptyPromotions: Promotion[] = []

const today = new Date().toISOString().slice(0, 10)

const emptyForm: PromotionFormState = {
  code: '',
  name: '',
  description: '',
  type: 'percentage',
  value: '',
  minimumOrder: '0',
  maximumDiscount: '',
  usageLimit: '100',
  startDate: today,
  endDate: '2026-12-31',
  enabled: true,
}

const getPromotionStatus = (promotion: Promotion): PromotionStatus => {
  if (promotion.backendStatus === 'HET_HAN') return 'ended'
  if (!promotion.enabled) return 'disabled'
  const currentDate = new Date(`${today}T00:00:00`)
  if (currentDate < new Date(`${promotion.startDate}T00:00:00`)) return 'scheduled'
  if (currentDate > new Date(`${promotion.endDate}T23:59:59`)) return 'expired'
  return 'active'
}

const formatPromotionValue = (promotion: Pick<Promotion, 'type' | 'value'>) => {
  if (promotion.type === 'percentage') return `${promotion.value}%`
  if (promotion.type === 'fixed') return formatPrice(promotion.value)
  if (promotion.type === 'shipping') return 'Miễn phí'
  return 'Mẫu thử'
}

const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN')

function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(emptyPromotions)
  const [searchValue, setSearchValue] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | PromotionType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | PromotionStatus>('all')
  const [sortBy, setSortBy] = useState<PromotionSort>('newest')
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<PromotionFormState>(emptyForm)
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPromotions = async () => {
    try {
      const rows = await api.get<Array<Record<string, any>>>('/admin/promotions')
      setPromotions(rows.map((item) => ({
        id: String(item.id), code: String(item.code), name: String(item.name), description: String(item.description || ''),
        type: item.type === 'PHAN_TRAM' ? 'percentage' : item.type === 'MIEN_PHI_VAN_CHUYEN' ? 'shipping' : 'fixed',
        value: Number(item.value), minimumOrder: Number(item.minimumOrder),
        maximumDiscount: item.maximumDiscount == null ? undefined : Number(item.maximumDiscount),
        usageLimit: Number(item.maximumUses || 0), usedCount: Number(item.usedCount || 0),
        startDate: String(item.startsAt).slice(0, 10), endDate: String(item.endsAt).slice(0, 10),
        enabled: item.status === 'HOAT_DONG',
        backendStatus: item.status === 'HOAT_DONG' ? 'HOAT_DONG' : item.status === 'HET_HAN' ? 'HET_HAN' : 'TAM_DUNG',
      })))
    } catch {
      setPromotions([])
    }
  }

  useEffect(() => { void loadPromotions() }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!isFormOpen && !deletingPromotion) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFormOpen(false)
        setDeletingPromotion(null)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [deletingPromotion, isFormOpen])

  const filteredPromotions = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase('vi-VN')
    const result = promotions.filter((promotion) => {
      const status = getPromotionStatus(promotion)
      const matchesKeyword = !keyword || [promotion.code, promotion.name, promotion.description]
        .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
      const matchesType = typeFilter === 'all' || promotion.type === typeFilter
      const matchesStatus = statusFilter === 'all' || status === statusFilter
      return matchesKeyword && matchesType && matchesStatus
    })

    return result.sort((first, second) => {
      if (sortBy === 'ending') return first.endDate.localeCompare(second.endDate)
      if (sortBy === 'usage') return second.usedCount - first.usedCount
      if (sortBy === 'code') return first.code.localeCompare(second.code)
      return second.startDate.localeCompare(first.startDate)
    })
  }, [promotions, searchValue, sortBy, statusFilter, typeFilter])

  const { currentPage, totalPages, pageItems: paginatedPromotions, setCurrentPage } = usePagination(
    filteredPromotions,
    6,
    `${searchValue}|${typeFilter}|${statusFilter}|${sortBy}`,
  )

  const activeCount = promotions.filter((promotion) => getPromotionStatus(promotion) === 'active').length
  const scheduledCount = promotions.filter((promotion) => getPromotionStatus(promotion) === 'scheduled').length
  const totalUsage = promotions.reduce((total, promotion) => total + promotion.usedCount, 0)

  const openCreateForm = () => {
    setEditingPromotion(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEditForm = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setForm({
      code: promotion.code,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      value: String(promotion.value),
      minimumOrder: String(promotion.minimumOrder),
      maximumDiscount: promotion.maximumDiscount ? String(promotion.maximumDiscount) : '',
      usageLimit: String(promotion.usageLimit),
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      enabled: promotion.enabled,
    })
    setIsFormOpen(true)
  }

  const updateField = <K extends keyof PromotionFormState>(field: K, value: PromotionFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedCode = form.code.trim().toLocaleUpperCase('vi-VN')
    const duplicateCode = promotions.some((promotion) => promotion.code === normalizedCode && promotion.id !== editingPromotion?.id)

    if (duplicateCode) {
      setNotice({ text: 'Mã khuyến mãi này đã tồn tại', type: 'error' })
      return
    }

    if (form.endDate < form.startDate) {
      setNotice({ text: 'Ngày kết thúc phải sau ngày bắt đầu', type: 'error' })
      return
    }

    const promotionData = {
      code: normalizedCode,
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value) || 0,
      minimumOrder: Number(form.minimumOrder) || 0,
      maximumDiscount: Number(form.maximumDiscount) || undefined,
      usageLimit: Number(form.usageLimit) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      enabled: form.enabled,
    }

    try {
      const payload = {
        code: promotionData.code, name: promotionData.name, description: promotionData.description,
        type: promotionData.type === 'percentage' ? 'PHAN_TRAM' : promotionData.type === 'shipping' ? 'MIEN_PHI_VAN_CHUYEN' : 'SO_TIEN',
        value: promotionData.type === 'shipping' ? 0 : promotionData.value, minimumOrder: promotionData.minimumOrder,
        maximumDiscount: promotionData.type === 'percentage' ? promotionData.maximumDiscount : null,
        maximumUses: promotionData.usageLimit || null, maximumUsesPerCustomer: 1,
        startsAt: `${promotionData.startDate} 00:00:00`, endsAt: `${promotionData.endDate} 23:59:59`,
        status: promotionData.enabled ? 'HOAT_DONG' : 'TAM_DUNG', productIds: [],
      }
      if (editingPromotion) await api.put(`/admin/promotions/${editingPromotion.id}`, payload)
      else await api.post('/admin/promotions', payload)
      await loadPromotions()
      setNotice({ text: editingPromotion ? `Đã cập nhật mã ${normalizedCode}` : `Đã tạo mã ${normalizedCode}`, type: 'success' })
      setIsFormOpen(false)
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Không thể lưu khuyến mãi', type: 'error' })
    }
  }

  const togglePromotion = async (promotion: Promotion) => {
    const nextEnabled = !promotion.enabled
    try {
      await api.put(`/admin/promotions/${promotion.id}`, { status: nextEnabled ? 'HOAT_DONG' : 'TAM_DUNG' })
      await loadPromotions()
      setNotice({ text: `${nextEnabled ? 'Đã bật' : 'Đã tắt'} mã ${promotion.code}`, type: 'success' })
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Không thể cập nhật khuyến mãi', type: 'error' })
    }
  }

  const confirmDelete = async () => {
    if (!deletingPromotion) return
    setIsDeleting(true)
    try {
      const result = await api.delete<{ action: 'deleted' | 'ended' }>(`/admin/promotions/${deletingPromotion.id}`)
      await loadPromotions()
      setNotice({
        text: result.action === 'deleted'
          ? `Đã xóa mã ${deletingPromotion.code}`
          : `Đã kết thúc mã ${deletingPromotion.code} và giữ lại lịch sử sử dụng`,
        type: 'success',
      })
      setDeletingPromotion(null)
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Không thể xóa khuyến mãi', type: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AdminLayout activeItem="promotions" searchValue={searchValue} onSearchChange={setSearchValue} searchPlaceholder="Tìm mã hoặc tên chương trình...">
      <div className="admin-page-heading admin-promotions-heading">
        <div><p>QUẢN LÝ ƯU ĐÃI</p><h1>Quản lý khuyến mãi</h1><span>Theo dõi mã giảm giá, thời hạn và hiệu quả sử dụng.</span></div>
        <button type="button" className="admin-promotion-primary" onClick={openCreateForm}><AdminIcon name="plus" />Thêm khuyến mãi</button>
      </div>

      <section className="admin-promotion-summary" aria-label="Tổng quan khuyến mãi">
        <article><span className="is-red"><AdminIcon name="discount" /></span><div><small>Tổng chương trình</small><strong>{promotions.length}</strong></div></article>
        <article><span className="is-green"><AdminIcon name="play" /></span><div><small>Đang diễn ra</small><strong>{activeCount}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="calendar" /></span><div><small>Sắp diễn ra</small><strong>{scheduledCount}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="cart" /></span><div><small>Lượt sử dụng</small><strong>{totalUsage.toLocaleString('vi-VN')}</strong></div></article>
      </section>

      <section className="admin-promotions-panel">
        <div className="admin-promotions-toolbar">
          <div>
            <label><span>Loại ưu đãi</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | PromotionType)} aria-label="Lọc theo loại ưu đãi"><option value="all">Tất cả loại</option>{Object.entries(promotionTypes).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label>
            <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | PromotionStatus)} aria-label="Lọc theo trạng thái"><option value="all">Tất cả trạng thái</option>{Object.entries(promotionStatuses).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label>
            <label><span>Sắp xếp</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as PromotionSort)} aria-label="Sắp xếp khuyến mãi"><option value="newest">Mới bắt đầu</option><option value="ending">Sắp kết thúc</option><option value="usage">Dùng nhiều nhất</option><option value="code">Theo mã A-Z</option></select></label>
          </div>
          <span>Hiển thị <strong>{filteredPromotions.length}</strong> / {promotions.length} chương trình</span>
        </div>

        <div className="admin-promotions-table-wrap">
          <table className="admin-promotions-table">
            <thead><tr><th>Chương trình</th><th>Loại giảm</th><th>Giá trị</th><th>Điều kiện</th><th>Thời gian</th><th>Lượt dùng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {paginatedPromotions.map((promotion) => {
                const status = getPromotionStatus(promotion)
                const usagePercent = promotion.usageLimit > 0 ? Math.min(100, Math.round((promotion.usedCount / promotion.usageLimit) * 100)) : 0
                const canModify = promotion.backendStatus !== 'HET_HAN'
                const canDelete = canModify || promotion.usedCount === 0
                return (
                  <tr key={promotion.id}>
                    <td><div className="admin-promotion-cell"><span><AdminIcon name="discount" /></span><div><strong>{promotion.code}</strong><b>{promotion.name}</b><small>{promotion.description}</small></div></div></td>
                    <td><span className={`admin-promotion-type is-${promotion.type}`}>{promotionTypes[promotion.type].label}</span></td>
                    <td><div className="admin-promotion-value"><strong>{formatPromotionValue(promotion)}</strong>{promotion.maximumDiscount ? <span>Tối đa {formatPrice(promotion.maximumDiscount)}</span> : null}</div></td>
                    <td><span className="admin-promotion-condition">Đơn từ {formatPrice(promotion.minimumOrder)}</span></td>
                    <td><div className="admin-promotion-period"><span>{formatDate(promotion.startDate)}</span><i>→</i><span>{formatDate(promotion.endDate)}</span></div></td>
                    <td><div className="admin-promotion-usage"><span><strong>{promotion.usedCount}</strong> / {promotion.usageLimit || '∞'}</span><i><b style={{ width: `${usagePercent}%` }} /></i></div></td>
                    <td><span className={`admin-promotion-status is-${status}`}><i />{promotionStatuses[status].label}</span></td>
                    <td><div className="admin-promotion-actions">{canModify ? <><button type="button" onClick={() => openEditForm(promotion)} aria-label={`Sửa ${promotion.code}`} title="Sửa khuyến mãi"><AdminIcon name="edit" /></button><button type="button" onClick={() => togglePromotion(promotion)} aria-label={`${promotion.enabled ? 'Tắt' : 'Bật'} ${promotion.code}`} title={promotion.enabled ? 'Tắt chương trình' : 'Bật chương trình'}><AdminIcon name={promotion.enabled ? 'pause' : 'play'} /></button></> : null}{canDelete ? <button type="button" className="is-danger" onClick={() => setDeletingPromotion(promotion)} aria-label={`${promotion.usedCount > 0 ? 'Kết thúc' : 'Xóa'} ${promotion.code}`} title={promotion.usedCount > 0 ? 'Kết thúc chương trình' : 'Xóa khuyến mãi'}><AdminIcon name="trash" /></button> : null}</div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredPromotions.length === 0 ? <div className="admin-promotions-empty"><AdminIcon name="search" /><strong>Không tìm thấy khuyến mãi</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredPromotions.length} pageSize={6} itemLabel="chương trình" onPageChange={setCurrentPage} />
      </section>

      {isFormOpen ? (
        <div className="admin-promotion-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsFormOpen(false)}>
          <section className="admin-promotion-modal" role="dialog" aria-modal="true" aria-labelledby="admin-promotion-modal-title">
            <header><div><span>{editingPromotion ? editingPromotion.code : 'CHƯƠNG TRÌNH MỚI'}</span><h2 id="admin-promotion-modal-title">{editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi'}</h2></div><button type="button" onClick={() => setIsFormOpen(false)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <form onSubmit={handleSubmit}>
              <div className="admin-promotion-form-grid">
                <label><span>Mã khuyến mãi *</span><input required maxLength={24} value={form.code} onChange={(event) => updateField('code', event.target.value.toLocaleUpperCase('vi-VN').replace(/\s+/g, ''))} /></label>
                <label><span>Tên chương trình *</span><input required value={form.name} onChange={(event) => updateField('name', event.target.value)} /></label>
                <label><span>Loại ưu đãi *</span><select value={form.type} onChange={(event) => updateField('type', event.target.value as PromotionType)}>{Object.entries(promotionTypes).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label>
                <label><span>{form.type === 'percentage' ? 'Phần trăm giảm' : 'Giá trị giảm'}</span><input min="0" max={form.type === 'percentage' ? 100 : undefined} type="number" value={form.value} onChange={(event) => updateField('value', event.target.value)} disabled={form.type === 'shipping'} /></label>
                <label><span>Giá trị đơn tối thiểu *</span><input required min="0" type="number" value={form.minimumOrder} onChange={(event) => updateField('minimumOrder', event.target.value)} /></label>
                <label><span>Giảm tối đa</span><input min="0" type="number" value={form.maximumDiscount} onChange={(event) => updateField('maximumDiscount', event.target.value)} disabled={form.type !== 'percentage'} /></label>
                <label><span>Ngày bắt đầu *</span><input required type="date" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} /></label>
                <label><span>Ngày kết thúc *</span><input required type="date" min={form.startDate} value={form.endDate} onChange={(event) => updateField('endDate', event.target.value)} /></label>
                <label><span>Giới hạn lượt dùng *</span><input required min="0" type="number" value={form.usageLimit} onChange={(event) => updateField('usageLimit', event.target.value)} /></label>
                <label className="admin-promotion-checkbox"><input type="checkbox" checked={form.enabled} onChange={(event) => updateField('enabled', event.target.checked)} /><span>Kích hoạt chương trình sau khi lưu</span></label>
                <label className="is-wide"><span>Điều kiện áp dụng *</span><textarea required rows={3} value={form.description} onChange={(event) => updateField('description', event.target.value)} /></label>
              </div>
              <footer><button type="button" className="admin-promotion-secondary" onClick={() => setIsFormOpen(false)}>Hủy</button><button type="submit" className="admin-promotion-primary">{editingPromotion ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}</button></footer>
            </form>
          </section>
        </div>
      ) : null}

      {deletingPromotion ? (
        <div className="admin-promotion-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDeletingPromotion(null)}>
          <section className="admin-promotion-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="admin-promotion-delete-title"><span><AdminIcon name="trash" /></span><h2 id="admin-promotion-delete-title">{deletingPromotion.usedCount > 0 ? 'Kết thúc khuyến mãi?' : 'Xóa khuyến mãi?'}</h2><p>{deletingPromotion.usedCount > 0 ? <>Mã <strong>{deletingPromotion.code}</strong> đã có {deletingPromotion.usedCount.toLocaleString('vi-VN')} lượt sử dụng nên sẽ được kết thúc thay vì xóa. Lịch sử đơn hàng vẫn được giữ nguyên.</> : <>Mã <strong>{deletingPromotion.code}</strong> chưa được sử dụng và sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.</>}</p><div><button type="button" className="admin-promotion-secondary" disabled={isDeleting} onClick={() => setDeletingPromotion(null)}>Hủy</button><button type="button" className="admin-promotion-danger" disabled={isDeleting} onClick={confirmDelete}>{isDeleting ? 'Đang xử lý...' : deletingPromotion.usedCount > 0 ? 'Kết thúc chương trình' : 'Xóa khuyến mãi'}</button></div></section>
        </div>
      ) : null}

      {notice ? <div className={`admin-promotion-toast is-${notice.type}`} role="status"><span>{notice.type === 'success' ? '✓' : '!'}</span>{notice.text}</div> : null}
    </AdminLayout>
  )
}

export default AdminPromotionsPage
