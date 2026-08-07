import { useEffect, useState } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import { formatPrice } from '../../data/products'
import { api } from '../../services/api'
import './AdminLoyaltyTiersPage.css'

export interface LoyaltyTier {
  id: string
  code: string
  name: string
  minimumSpend: number
  earningRate: number
  status: 'HOAT_DONG' | 'TAM_DUNG'
  customerCount: number
}

const getTierBadgeClass = (code: string) => {
  const normalized = code.toLowerCase()
  if (normalized === 'thanh_vien') return 'is-thanh_vien'
  if (normalized === 'bac') return 'is-bac'
  if (normalized === 'vang') return 'is-vang'
  if (normalized === 'kim_cuong') return 'is-kim_cuong'
  return 'is-custom'
}

export function AdminLoyaltyTiersPage() {
  const [tiers, setTiers] = useState<LoyaltyTier[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null)
  const [deletingTier, setDeletingTier] = useState<LoyaltyTier | null>(null)
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form State
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formMinimumSpend, setFormMinimumSpend] = useState('0')
  const [formEarningPercent, setFormEarningPercent] = useState('1.0')
  const [formStatus, setFormStatus] = useState<'HOAT_DONG' | 'TAM_DUNG'>('HOAT_DONG')
  const [formSubmitting, setFormSubmitting] = useState(false)

  const loadTiers = async () => {
    setLoading(true)
    try {
      const data = await api.get<LoyaltyTier[]>('/admin/loyalty-tiers')
      setTiers(data)
    } catch {
      setTiers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTiers()
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 3000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const openCreateModal = () => {
    setModalMode('create')
    setEditingTier(null)
    setFormCode('')
    setFormName('')
    setFormMinimumSpend('1000000')
    setFormEarningPercent('1.5')
    setFormStatus('HOAT_DONG')
  }

  const openEditModal = (tier: LoyaltyTier) => {
    setModalMode('edit')
    setEditingTier(tier)
    setFormCode(tier.code)
    setFormName(tier.name)
    setFormMinimumSpend(String(tier.minimumSpend))
    setFormEarningPercent(String(Math.round(tier.earningRate * 1000) / 10))
    setFormStatus(tier.status)
  }

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)

    const minSpend = Math.max(0, Number(formMinimumSpend) || 0)
    const ratePercent = Math.max(0, Math.min(100, Number(formEarningPercent) || 0))
    const earningRate = ratePercent / 100

    try {
      if (modalMode === 'create') {
        if (!formCode.trim()) throw new Error('Vui lòng nhập mã hạng')
        if (!formName.trim()) throw new Error('Vui lòng nhập tên hạng')
        await api.post('/admin/loyalty-tiers', {
          code: formCode.trim().toUpperCase().replace(/\s+/g, '_'),
          name: formName.trim(),
          minimumSpend: minSpend,
          earningRate,
          status: formStatus,
        })
        setNotice({ text: `Đã tạo hạng mới: ${formName.trim()}`, type: 'success' })
      } else if (modalMode === 'edit' && editingTier) {
        await api.put(`/admin/loyalty-tiers/${editingTier.id}`, {
          code: formCode.trim().toUpperCase().replace(/\s+/g, '_'),
          name: formName.trim(),
          minimumSpend: minSpend,
          earningRate,
          status: formStatus,
        })
        setNotice({ text: `Đã cập nhật hạng: ${formName.trim()}`, type: 'success' })
      }
      setModalMode(null)
      await loadTiers()
    } catch (err) {
      setNotice({ text: err instanceof Error ? err.message : 'Lỗi cập nhật hạng thành viên', type: 'error' })
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteTier = async () => {
    if (!deletingTier) return
    try {
      await api.delete(`/admin/loyalty-tiers/${deletingTier.id}`)
      setNotice({ text: `Đã xóa hạng ${deletingTier.name}`, type: 'success' })
      setDeletingTier(null)
      await loadTiers()
    } catch (err) {
      setNotice({ text: err instanceof Error ? err.message : 'Không thể xóa hạng thành viên', type: 'error' })
    }
  }

  const handleRecalculateRanks = async () => {
    setRecalculating(true)
    try {
      const res = await api.post<{ affectedCount: number }>('/admin/loyalty-tiers/recalculate')
      setNotice({ text: `Đồng bộ thành công! Đã tính lại hạng cho ${res.affectedCount} khách hàng.`, type: 'success' })
      await loadTiers()
    } catch (err) {
      setNotice({ text: err instanceof Error ? err.message : 'Lỗi đồng bộ hạng', type: 'error' })
    } finally {
      setRecalculating(false)
    }
  }

  const totalMembers = tiers.reduce((sum, t) => sum + t.customerCount, 0)

  return (
    <AdminLayout activeItem="hangThanhVien">
      <header className="admin-loyalty-heading">
        <div>
          <p>RUBEANORA REWARDS</p>
          <h1>Quản lý hạng khách hàng</h1>
          <span>Chỉnh sửa mức chi tiêu tối thiểu, % tích xu và thêm/xóa hạng thân thiết.</span>
        </div>
        <div className="admin-loyalty-actions">
          <button type="button" className="admin-btn-secondary" onClick={() => void handleRecalculateRanks()} disabled={recalculating}>
            <AdminIcon name="dashboard" />
            <span>{recalculating ? 'Đang đồng bộ...' : 'Đồng bộ lại rank khách'}</span>
          </button>
          <button type="button" className="admin-btn-primary" onClick={openCreateModal}>
            <AdminIcon name="plus" />
            <span>Thêm hạng mới</span>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="admin-loyalty-stats">
        <article>
          <span className="stat-icon is-gold"><AdminIcon name="star" /></span>
          <div>
            <small>Tổng số hạng</small>
            <strong>{tiers.length} cấp hạng</strong>
          </div>
        </article>
        <article>
          <span className="stat-icon is-blue"><AdminIcon name="customers" /></span>
          <div>
            <small>Tổng khách đã xếp hạng</small>
            <strong>{totalMembers} khách hàng</strong>
          </div>
        </article>
        <article>
          <span className="stat-icon is-green"><AdminIcon name="discount" /></span>
          <div>
            <small>Hạng thưởng cao nhất</small>
            <strong>
              {tiers.length > 0 ? `${(Math.max(...tiers.map((t) => t.earningRate)) * 100).toLocaleString('vi-VN')}% xu` : '0%'}
            </strong>
          </div>
        </article>
      </section>

      {/* Tiers Grid */}
      {loading ? (
        <div className="admin-accounts-empty">Đang tải danh sách hạng thành viên...</div>
      ) : (
        <div className="admin-loyalty-grid">
          {tiers.map((tier) => (
            <article key={tier.id} className="admin-tier-card">
              <div className="admin-tier-header">
                <span className={`admin-tier-badge ${getTierBadgeClass(tier.code)}`}>
                  <AdminIcon name="star" />
                  {tier.name}
                </span>
                <span className={`admin-tier-status ${tier.status === 'HOAT_DONG' ? 'is-active' : 'is-paused'}`}>
                  {tier.status === 'HOAT_DONG' ? 'Hoạt động' : 'Tạm dừng'}
                </span>
              </div>

              <div className="admin-tier-info">
                <h2>{tier.name}</h2>
                <span className="admin-tier-code">CODE: {tier.code}</span>

                <div className="admin-tier-details">
                  <div className="admin-tier-detail-item">
                    <small>Chi tiêu tối thiểu</small>
                    <strong>{tier.minimumSpend === 0 ? '0đ (Mặc định)' : formatPrice(tier.minimumSpend)}</strong>
                  </div>
                  <div className="admin-tier-detail-item">
                    <small>Tích xu mỗi đơn</small>
                    <strong className="is-rate">{(tier.earningRate * 100).toLocaleString('vi-VN')}% xu</strong>
                  </div>
                </div>
              </div>

              <div className="admin-tier-footer">
                <span className="admin-tier-members">
                  <strong>{tier.customerCount}</strong> khách hàng đang thuộc hạng
                </span>
                <div className="admin-tier-actions">
                  <button type="button" onClick={() => openEditModal(tier)} title="Chỉnh sửa mức hạng">
                    <AdminIcon name="edit" />
                  </button>
                  <button type="button" className="is-delete" onClick={() => setDeletingTier(tier)} title="Xóa hạng">
                    <AdminIcon name="trash" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalMode ? (
        <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModalMode(null)}>
          <section className="admin-modal" role="dialog">
            <header>
              <h2>{modalMode === 'create' ? 'Thêm hạng thành viên mới' : `Chỉnh sửa hạng: ${editingTier?.name}`}</h2>
              <button type="button" onClick={() => setModalMode(null)}>
                <AdminIcon name="close" />
              </button>
            </header>
            <form onSubmit={(e) => void handleSubmitModal(e)}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Mã hạng (Ví dụ: BAC, VANG, BACH_KIM)</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="MÃ_HẠNG"
                    disabled={modalMode === 'edit'}
                  />
                  <span className="admin-form-hint">Mã định danh hệ thống (chữ hoa, viết liền không dấu).</span>
                </div>

                <div className="admin-form-group">
                  <label>Tên hiển thị hạng thành viên</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ví dụ: Bạc, Vàng, Bạch Kim..."
                  />
                </div>

                <div className="admin-form-group">
                  <label>Mức chi tiêu tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    required
                    value={formMinimumSpend}
                    onChange={(e) => setFormMinimumSpend(e.target.value)}
                    placeholder="1000000"
                  />
                  <span className="admin-form-hint">
                    Hiển thị: <strong>{formatPrice(Number(formMinimumSpend) || 0)}</strong>. Khách hàng đạt mốc này sẽ tự động lên rank.
                  </span>
                </div>

                <div className="admin-form-group">
                  <label>Tỷ lệ nhận xu (% nhận xu)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    value={formEarningPercent}
                    onChange={(e) => setFormEarningPercent(e.target.value)}
                    placeholder="1.5"
                  />
                  <span className="admin-form-hint">
                    Ví dụ: 1.5 tức nhận 1.5% giá trị hàng hóa làm xu tích lũy.
                  </span>
                </div>

                <div className="admin-form-group">
                  <label>Trạng thái</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'HOAT_DONG' | 'TAM_DUNG')}>
                    <option value="HOAT_DONG">Hoạt động</option>
                    <option value="TAM_DUNG">Tạm dừng</option>
                  </select>
                </div>
              </div>

              <footer className="admin-modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setModalMode(null)}>
                  Hủy
                </button>
                <button type="submit" className="admin-btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Đang lưu...' : 'Lưu mức hạng'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {/* Delete Modal */}
      {deletingTier ? (
        <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDeletingTier(null)}>
          <section className="admin-modal" role="alertdialog">
            <header>
              <h2>Xóa hạng thành viên?</h2>
              <button type="button" onClick={() => setDeletingTier(null)}>
                <AdminIcon name="close" />
              </button>
            </header>
            <div className="admin-modal-body">
              <p>
                Bạn có chắc chắn muốn xóa hạng <strong>{deletingTier.name}</strong> ({deletingTier.code})?
              </p>
              <p className="admin-form-hint" style={{ color: '#dc2626', marginTop: '0.5rem' }}>
                Hệ thống sẽ tự động chuyển các khách hàng thuộc hạng này sang hạng phù hợp khác dựa trên tổng chi tiêu.
              </p>
            </div>
            <footer className="admin-modal-footer">
              <button type="button" className="admin-btn-secondary" onClick={() => setDeletingTier(null)}>
                Hủy
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ background: '#dc2626' }}
                onClick={() => void handleDeleteTier()}
              >
                Xóa ngay
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {/* Toast Notice */}
      {notice ? (
        <div className={`admin-toast is-${notice.type}`}>
          <span>{notice.type === 'success' ? '✓' : '!'}</span>
          {notice.text}
        </div>
      ) : null}
    </AdminLayout>
  )
}

export default AdminLoyaltyTiersPage
