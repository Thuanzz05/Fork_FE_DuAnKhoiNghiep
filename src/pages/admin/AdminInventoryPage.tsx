import { useEffect, useMemo, useState, type FormEvent } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import Pagination from '../../components/Pagination'
import { formatPrice } from '../../data/products'
import { usePagination } from '../../hooks/usePagination'
import { api } from '../../services/api'
import './AdminInventoryPage.css'

type InventoryView = 'stock' | 'vouchers'
type StockStatus = 'good' | 'low' | 'out'
type VoucherType = 'in' | 'out'
type VoucherPeriod = 'all' | '7days' | '30days'
type VoucherSort = 'newest' | 'oldest' | 'quantity'

interface InventoryProduct {
  id: string
  sku: string
  name: string
  image: string
  category: string
  categorySlug: string
  unit: string
  stock: number
  minimumStock: number
  costPrice: number
  location: string
  updatedAt: string
}

interface VoucherItem {
  productId: string
  quantity: number
  unitCost: number
}

interface StockVoucher {
  id: string
  code: string
  type: VoucherType
  createdAt: string
  partner: string
  note: string
  createdBy: string
  items: VoucherItem[]
}

interface VoucherLineForm {
  id: string
  productId: string
  quantity: string
  unitCost: string
}

interface VoucherFormState {
  type: VoucherType
  date: string
  partner: string
  note: string
  lines: VoucherLineForm[]
}

const initialInventory: InventoryProduct[] = []
const initialVouchers: StockVoucher[] = []

const stockStatusMeta: Record<StockStatus, { label: string; tone: string }> = {
  good: { label: 'Tồn ổn định', tone: 'good' },
  low: { label: 'Sắp hết', tone: 'low' },
  out: { label: 'Hết hàng', tone: 'out' },
}

const getStockStatus = (product: InventoryProduct): StockStatus => {
  if (product.stock === 0) return 'out'
  if (product.stock <= product.minimumStock) return 'low'
  return 'good'
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(value))

const toDateInput = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

let voucherLineSequence = 0
const createVoucherLine = (product: InventoryProduct): VoucherLineForm => ({
  id: `line-${Date.now()}-${voucherLineSequence++}`,
  productId: product.id,
  quantity: '1',
  unitCost: String(product.costPrice),
})

function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryProduct[]>(initialInventory)
  const [vouchers, setVouchers] = useState<StockVoucher[]>(initialVouchers)
  const [activeView, setActiveView] = useState<InventoryView>('stock')
  const [searchValue, setSearchValue] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState<'all' | StockStatus>('all')
  const [stockSort, setStockSort] = useState<'name' | 'stock-asc' | 'stock-desc' | 'value'>('stock-asc')
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<'all' | VoucherType>('all')
  const [voucherPeriod, setVoucherPeriod] = useState<VoucherPeriod>('all')
  const [voucherSort, setVoucherSort] = useState<VoucherSort>('newest')
  const [isVoucherFormOpen, setIsVoucherFormOpen] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<StockVoucher | null>(null)
  const [notice, setNotice] = useState('')
  const [suppliers, setSuppliers] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [voucherForm, setVoucherForm] = useState<VoucherFormState>(() => ({
    type: 'in', date: toDateInput(), partner: '', note: '', lines: [],
  }))

  const loadInventory = async () => {
    try {
      const data = await api.get<{
        products: Array<Record<string, any>>; suppliers: Array<{ id: string; code: string; name: string }>
        imports: Array<Record<string, any>>; exports: Array<Record<string, any>>
      }>('/admin/inventory')
      setInventory(data.products.map((item) => ({
        id: String(item.id), sku: String(item.sku), name: String(item.name), image: String(item.image || ''),
        category: '', categorySlug: '', unit: 'Sản phẩm', stock: Number(item.stock),
        minimumStock: Number(item.minimumStock), costPrice: Number(item.costPrice), location: 'Kho chính',
        updatedAt: new Date().toISOString(),
      })))
      setSuppliers(data.suppliers)
      const imports = data.imports.map((item) => ({
        id: String(item.id), code: String(item.code), type: 'in' as const, createdAt: String(item.date),
        partner: String(item.supplierName || ''), note: String(item.note || ''), createdBy: String(item.createdBy || ''), items: [],
      }))
      const exports = data.exports.map((item) => ({
        id: String(item.id), code: String(item.code), type: 'out' as const, createdAt: String(item.date),
        partner: String(item.recipient || ''), note: String(item.note || ''), createdBy: String(item.createdBy || ''), items: [],
      }))
      setVouchers([...imports, ...exports])
    } catch {
      setInventory([])
      setVouchers([])
    }
  }

  useEffect(() => { void loadInventory() }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!isVoucherFormOpen && !selectedVoucher) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVoucherFormOpen(false)
        setSelectedVoucher(null)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVoucherFormOpen, selectedVoucher])

  const filteredInventory = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase('vi-VN')
    return inventory
      .filter((product) => {
        const matchesSearch = !keyword || [product.name, product.sku, product.category, product.location]
          .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
        const matchesCategory = categoryFilter === 'all' || product.categorySlug === categoryFilter
        const matchesStatus = stockFilter === 'all' || getStockStatus(product) === stockFilter
        return matchesSearch && matchesCategory && matchesStatus
      })
      .sort((a, b) => {
        if (stockSort === 'stock-asc') return a.stock - b.stock
        if (stockSort === 'stock-desc') return b.stock - a.stock
        if (stockSort === 'value') return (b.stock * b.costPrice) - (a.stock * a.costPrice)
        return a.name.localeCompare(b.name, 'vi')
      })
  }, [categoryFilter, inventory, searchValue, stockFilter, stockSort])

  const filteredVouchers = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase('vi-VN')
    const now = new Date()
    const periodDays = voucherPeriod === '7days' ? 7 : voucherPeriod === '30days' ? 30 : null

    return vouchers
      .filter((voucher) => {
        const productNames = voucher.items.map((item) => inventory.find((product) => product.id === item.productId)?.name ?? '')
        const matchesSearch = !keyword || [voucher.code, voucher.partner, voucher.createdBy, ...productNames]
          .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
        const matchesType = voucherTypeFilter === 'all' || voucher.type === voucherTypeFilter
        const ageInDays = (now.getTime() - new Date(voucher.createdAt).getTime()) / 86400000
        const matchesPeriod = periodDays === null || ageInDays <= periodDays
        return matchesSearch && matchesType && matchesPeriod
      })
      .sort((a, b) => {
        if (voucherSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        if (voucherSort === 'quantity') {
          const quantityA = a.items.reduce((total, item) => total + item.quantity, 0)
          const quantityB = b.items.reduce((total, item) => total + item.quantity, 0)
          return quantityB - quantityA
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [inventory, searchValue, voucherPeriod, voucherSort, voucherTypeFilter, vouchers])

  const {
    currentPage: inventoryPage,
    totalPages: inventoryTotalPages,
    pageItems: paginatedInventory,
    setCurrentPage: setInventoryPage,
  } = usePagination(filteredInventory, 6, `${searchValue}|${categoryFilter}|${stockFilter}|${stockSort}`)

  const {
    currentPage: voucherPage,
    totalPages: voucherTotalPages,
    pageItems: paginatedVouchers,
    setCurrentPage: setVoucherPage,
  } = usePagination(filteredVouchers, 6, `${searchValue}|${voucherTypeFilter}|${voucherPeriod}|${voucherSort}`)

  const inventoryCategories = Array.from(new Map(inventory.filter((item) => item.categorySlug).map((item) => [item.categorySlug, item.category])).entries())

  const totalStock = inventory.reduce((total, product) => total + product.stock, 0)
  const replenishmentCount = inventory.filter((product) => product.stock <= product.minimumStock).length
  const inventoryValue = inventory.reduce((total, product) => total + product.stock * product.costPrice, 0)

  const openVoucherForm = (type: VoucherType) => {
    const firstProduct = inventory[0]
    if (!firstProduct) {
      setNotice('Chưa có sản phẩm để tạo phiếu kho')
      return
    }
    setVoucherForm({ type, date: toDateInput(), partner: '', note: '', lines: [createVoucherLine(firstProduct)] })
    setIsVoucherFormOpen(true)
  }

  const updateVoucherLine = (lineId: string, field: keyof Omit<VoucherLineForm, 'id'>, value: string) => {
    setVoucherForm((current) => ({
      ...current,
      lines: current.lines.map((line) => {
        if (line.id !== lineId) return line
        if (field === 'productId') {
          const product = inventory.find((item) => item.id === value)
          return { ...line, productId: value, unitCost: String(product?.costPrice ?? 0) }
        }
        return { ...line, [field]: value }
      }),
    }))
  }

  const addVoucherLine = () => {
    const availableProduct = inventory.find((product) => !voucherForm.lines.some((line) => line.productId === product.id)) ?? inventory[0]
    if (!availableProduct) return
    setVoucherForm((current) => ({ ...current, lines: [...current.lines, createVoucherLine(availableProduct)] }))
  }

  const removeVoucherLine = (lineId: string) => {
    setVoucherForm((current) => ({ ...current, lines: current.lines.filter((line) => line.id !== lineId) }))
  }

  const handleVoucherSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!voucherForm.lines.length) {
      setNotice('Phiếu kho cần ít nhất một sản phẩm')
      return
    }
    const parsedItems = voucherForm.lines.map((line) => ({
      productId: line.productId,
      quantity: Number(line.quantity),
      unitCost: Number(line.unitCost),
    }))
    const uniqueIds = new Set(parsedItems.map((item) => item.productId))
    if (uniqueIds.size !== parsedItems.length) {
      setNotice('Mỗi sản phẩm chỉ được xuất hiện một lần trong phiếu')
      return
    }
    if (voucherForm.type === 'out') {
      const insufficientItem = parsedItems.find((item) => {
        const product = inventory.find((entry) => entry.id === item.productId)
        return !product || item.quantity > product.stock
      })
      if (insufficientItem) {
        const product = inventory.find((entry) => entry.id === insufficientItem.productId)
        setNotice(`${product?.name ?? 'Sản phẩm'} không đủ tồn kho để xuất`)
        return
      }
    }

    const prefix = voucherForm.type === 'in' ? 'PN' : 'PX'
    const datePart = voucherForm.date.replace(/-/g, '').slice(2)
    const sequence = vouchers
      .filter((voucher) => voucher.code.startsWith(`${prefix}-${datePart}-`))
      .reduce((highest, voucher) => Math.max(highest, Number(voucher.code.split('-').at(-1)) || 0), 0) + 1
    const newVoucher: StockVoucher = {
      id: `voucher-${Date.now()}`,
      code: `${prefix}-${datePart}-${String(sequence).padStart(3, '0')}`,
      type: voucherForm.type,
      createdAt: `${voucherForm.date}T${new Date().toTimeString().slice(0, 8)}`,
      partner: voucherForm.partner.trim(),
      note: voucherForm.note.trim(),
      createdBy: 'Quản trị viên',
      items: parsedItems,
    }

    try {
      if (voucherForm.type === 'in') {
        let supplier = suppliers.find((item) => item.name.toLocaleLowerCase('vi-VN') === voucherForm.partner.trim().toLocaleLowerCase('vi-VN'))
        if (!supplier) {
          const created = await api.post<{ id: string }>('/admin/suppliers', {
            code: `NCC-${Date.now().toString().slice(-8)}`, name: voucherForm.partner.trim(),
          })
          supplier = { id: created.id, code: '', name: voucherForm.partner.trim() }
        }
        await api.post('/admin/imports', {
          code: newVoucher.code, supplierId: supplier.id, date: voucherForm.date,
          note: voucherForm.note.trim(),
          items: parsedItems.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitCost })),
        })
      } else {
        await api.post('/admin/exports', {
          code: newVoucher.code, type: 'XUAT_KHAC', date: voucherForm.date,
          recipient: voucherForm.partner.trim(), note: voucherForm.note.trim(),
          items: parsedItems.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitCost })),
        })
      }
      await loadInventory()
      setIsVoucherFormOpen(false)
      setActiveView('vouchers')
      setNotice(`Đã tạo ${voucherForm.type === 'in' ? 'phiếu nhập' : 'phiếu xuất'} ${newVoucher.code}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể tạo phiếu kho')
    }
  }

  const voucherTotal = (voucher: StockVoucher) => voucher.items.reduce((total, item) => total + item.quantity * item.unitCost, 0)
  const voucherQuantity = (voucher: StockVoucher) => voucher.items.reduce((total, item) => total + item.quantity, 0)

  return (
    <AdminLayout
      activeItem="inventory"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder={activeView === 'stock' ? 'Tìm tên sản phẩm, SKU, vị trí kho...' : 'Tìm mã phiếu, đối tác, người tạo...'}
    >
      <div className="admin-page-heading admin-inventory-heading">
        <div><p>QUẢN LÝ VẬN HÀNH</p><h1>Quản lý kho</h1><span>Theo dõi tồn hàng và toàn bộ lịch sử nhập, xuất kho.</span></div>
        <div className="admin-inventory-heading-actions">
          <button type="button" className="admin-inventory-secondary-action" onClick={() => openVoucherForm('out')}><AdminIcon name="arrowUp" />Tạo phiếu xuất</button>
          <button type="button" className="admin-inventory-primary-action" onClick={() => openVoucherForm('in')}><AdminIcon name="plus" />Tạo phiếu nhập</button>
        </div>
      </div>

      <section className="admin-inventory-summary" aria-label="Tổng quan kho hàng">
        <article><span className="is-red"><AdminIcon name="products" /></span><div><small>Tổng mã hàng</small><strong>{inventory.length}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="box" /></span><div><small>Tổng sản phẩm tồn</small><strong>{totalStock}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="bell" /></span><div><small>Cần nhập thêm</small><strong>{replenishmentCount}</strong></div></article>
        <article><span className="is-green"><AdminIcon name="revenue" /></span><div><small>Giá trị tồn kho</small><strong>{formatPrice(inventoryValue)}</strong></div></article>
      </section>

      <section className="admin-inventory-panel">
        <div className="admin-inventory-tabs" role="tablist" aria-label="Nội dung quản lý kho">
          <button type="button" role="tab" aria-selected={activeView === 'stock'} className={activeView === 'stock' ? 'is-active' : ''} onClick={() => setActiveView('stock')}>Tồn kho <span>{inventory.length}</span></button>
          <button type="button" role="tab" aria-selected={activeView === 'vouchers'} className={activeView === 'vouchers' ? 'is-active' : ''} onClick={() => setActiveView('vouchers')}>Phiếu nhập / xuất <span>{vouchers.length}</span></button>
        </div>

        {activeView === 'stock' ? (
          <>
            <div className="admin-inventory-toolbar">
              <div>
                <label><span>Danh mục</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Lọc kho theo danh mục"><option value="all">Tất cả danh mục</option>{inventoryCategories.map(([slug, name]) => <option value={slug} key={slug}>{name}</option>)}</select></label>
                <label><span>Tồn kho</span><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as 'all' | StockStatus)} aria-label="Lọc theo trạng thái tồn"><option value="all">Tất cả trạng thái</option><option value="good">Tồn ổn định</option><option value="low">Sắp hết</option><option value="out">Hết hàng</option></select></label>
                <label><span>Sắp xếp</span><select value={stockSort} onChange={(event) => setStockSort(event.target.value as typeof stockSort)} aria-label="Sắp xếp tồn kho"><option value="stock-asc">Tồn ít nhất</option><option value="stock-desc">Tồn nhiều nhất</option><option value="value">Giá trị tồn cao nhất</option><option value="name">Tên sản phẩm</option></select></label>
              </div>
              <span>Hiển thị <strong>{filteredInventory.length}</strong> / {inventory.length} sản phẩm</span>
            </div>
            <div className="admin-inventory-table-wrap">
              <table className="admin-inventory-stock-table">
                <thead><tr><th>Sản phẩm</th><th>Vị trí</th><th>Giá vốn</th><th>Tồn hiện tại</th><th>Tồn tối thiểu</th><th>Giá trị tồn</th><th>Trạng thái</th></tr></thead>
                <tbody>{paginatedInventory.map((product) => {
                  const status = stockStatusMeta[getStockStatus(product)]
                  return <tr key={product.id}>
                    <td><div className="admin-inventory-product"><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>{product.sku} · {product.category}</span></div></div></td>
                    <td><div className="admin-inventory-location"><strong>{product.location}</strong><span>Kho chính</span></div></td>
                    <td>{formatPrice(product.costPrice)}</td>
                    <td><strong className="admin-inventory-stock-number">{product.stock}</strong> {product.unit}</td>
                    <td>{product.minimumStock} {product.unit}</td>
                    <td><strong>{formatPrice(product.stock * product.costPrice)}</strong></td>
                    <td><span className={`admin-inventory-status is-${status.tone}`}><i />{status.label}</span></td>
                  </tr>
                })}</tbody>
              </table>
              {filteredInventory.length === 0 ? <div className="admin-inventory-empty"><AdminIcon name="search" /><strong>Không tìm thấy sản phẩm</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}
            </div>
            <Pagination currentPage={inventoryPage} totalPages={inventoryTotalPages} totalItems={filteredInventory.length} pageSize={6} itemLabel="sản phẩm" onPageChange={setInventoryPage} />
          </>
        ) : (
          <>
            <div className="admin-inventory-toolbar">
              <div>
                <label><span>Loại phiếu</span><select value={voucherTypeFilter} onChange={(event) => setVoucherTypeFilter(event.target.value as 'all' | VoucherType)} aria-label="Lọc loại phiếu kho"><option value="all">Tất cả phiếu</option><option value="in">Phiếu nhập</option><option value="out">Phiếu xuất</option></select></label>
                <label><span>Thời gian</span><select value={voucherPeriod} onChange={(event) => setVoucherPeriod(event.target.value as VoucherPeriod)} aria-label="Lọc thời gian phiếu kho"><option value="all">Tất cả thời gian</option><option value="7days">7 ngày gần đây</option><option value="30days">30 ngày gần đây</option></select></label>
                <label><span>Sắp xếp</span><select value={voucherSort} onChange={(event) => setVoucherSort(event.target.value as VoucherSort)} aria-label="Sắp xếp phiếu kho"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="quantity">Số lượng nhiều nhất</option></select></label>
              </div>
              <span>Hiển thị <strong>{filteredVouchers.length}</strong> / {vouchers.length} phiếu</span>
            </div>
            <div className="admin-inventory-table-wrap">
              <table className="admin-inventory-voucher-table">
                <thead><tr><th>Mã phiếu</th><th>Loại</th><th>Đối tác / Bộ phận</th><th>Sản phẩm</th><th>Số lượng</th><th>Giá trị</th><th>Người tạo</th><th>Thao tác</th></tr></thead>
                <tbody>{paginatedVouchers.map((voucher) => {
                  const firstProduct = inventory.find((product) => product.id === voucher.items[0]?.productId)
                  return <tr key={voucher.id}>
                    <td><div className="admin-inventory-voucher-code"><strong>{voucher.code}</strong><span>{formatDateTime(voucher.createdAt)}</span></div></td>
                    <td><span className={`admin-inventory-voucher-type is-${voucher.type}`}>{voucher.type === 'in' ? 'Phiếu nhập' : 'Phiếu xuất'}</span></td>
                    <td><div className="admin-inventory-partner"><strong>{voucher.partner}</strong><span>{voucher.note || 'Không có ghi chú'}</span></div></td>
                    <td><div className="admin-inventory-voucher-product"><img src={firstProduct?.image} alt="" /><div><strong>{firstProduct?.name}</strong><span>{voucher.items.length > 1 ? `+${voucher.items.length - 1} sản phẩm khác` : '1 sản phẩm'}</span></div></div></td>
                    <td><strong>{voucherQuantity(voucher)}</strong></td>
                    <td><strong>{formatPrice(voucherTotal(voucher))}</strong></td>
                    <td>{voucher.createdBy}</td>
                    <td><button type="button" className="admin-inventory-view-button" onClick={() => setSelectedVoucher(voucher)} aria-label={`Xem phiếu ${voucher.code}`} title="Xem chi tiết phiếu"><AdminIcon name="eye" /></button></td>
                  </tr>
                })}</tbody>
              </table>
              {filteredVouchers.length === 0 ? <div className="admin-inventory-empty"><AdminIcon name="search" /><strong>Không tìm thấy phiếu kho</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}
            </div>
            <Pagination currentPage={voucherPage} totalPages={voucherTotalPages} totalItems={filteredVouchers.length} pageSize={6} itemLabel="phiếu" onPageChange={setVoucherPage} />
          </>
        )}
      </section>

      {isVoucherFormOpen ? (
        <div className="admin-inventory-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsVoucherFormOpen(false)}>
          <section className="admin-inventory-voucher-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-voucher-form-title">
            <header><div><span>LẬP PHIẾU KHO</span><h2 id="inventory-voucher-form-title">{voucherForm.type === 'in' ? 'Tạo phiếu nhập kho' : 'Tạo phiếu xuất kho'}</h2></div><button type="button" onClick={() => setIsVoucherFormOpen(false)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <form onSubmit={handleVoucherSubmit}>
              <div className="admin-inventory-voucher-form-head">
                <div className="admin-inventory-type-switch"><button type="button" className={voucherForm.type === 'in' ? 'is-active' : ''} onClick={() => setVoucherForm((current) => ({ ...current, type: 'in' }))}>Phiếu nhập</button><button type="button" className={voucherForm.type === 'out' ? 'is-active' : ''} onClick={() => setVoucherForm((current) => ({ ...current, type: 'out' }))}>Phiếu xuất</button></div>
                <label><span>Ngày lập phiếu *</span><input type="date" required value={voucherForm.date} onChange={(event) => setVoucherForm((current) => ({ ...current, date: event.target.value }))} /></label>
                <label><span>{voucherForm.type === 'in' ? 'Nhà cung cấp / Nguồn nhập *' : 'Bộ phận / Mục đích xuất *'}</span><input required value={voucherForm.partner} placeholder={voucherForm.type === 'in' ? 'Nhập nhà cung cấp' : 'Nhập bộ phận hoặc mục đích xuất'} onChange={(event) => setVoucherForm((current) => ({ ...current, partner: event.target.value }))} /></label>
                <label className="is-wide"><span>Ghi chú</span><input value={voucherForm.note} placeholder="Nội dung bổ sung cho phiếu kho" onChange={(event) => setVoucherForm((current) => ({ ...current, note: event.target.value }))} /></label>
              </div>
              <section className="admin-inventory-voucher-lines">
                <header><div><h3>Sản phẩm trong phiếu</h3><span>{voucherForm.lines.length} dòng sản phẩm</span></div><button type="button" onClick={addVoucherLine}><AdminIcon name="plus" />Thêm sản phẩm</button></header>
                <div>{voucherForm.lines.map((line) => {
                  const selectedProduct = inventory.find((product) => product.id === line.productId)
                  return <article key={line.id}>
                    <label><span>Sản phẩm *</span><select value={line.productId} onChange={(event) => updateVoucherLine(line.id, 'productId', event.target.value)}>{inventory.map((product) => <option value={product.id} key={product.id}>{product.sku} - {product.name}</option>)}</select></label>
                    <label><span>Số lượng *</span><input type="number" required min="1" value={line.quantity} onChange={(event) => updateVoucherLine(line.id, 'quantity', event.target.value)} /></label>
                    <label><span>Đơn giá vốn *</span><input type="number" required min="0" value={line.unitCost} onChange={(event) => updateVoucherLine(line.id, 'unitCost', event.target.value)} /></label>
                    <div><span>Tồn hiện tại</span><strong>{selectedProduct?.stock ?? 0} {selectedProduct?.unit}</strong></div>
                    <button type="button" disabled={voucherForm.lines.length === 1} onClick={() => removeVoucherLine(line.id)} aria-label={`Xóa dòng ${selectedProduct?.name ?? ''}`}><AdminIcon name="trash" /></button>
                  </article>
                })}</div>
              </section>
              <footer><div><span>Tổng số lượng</span><strong>{voucherForm.lines.reduce((total, line) => total + (Number(line.quantity) || 0), 0)} sản phẩm</strong></div><button type="button" className="admin-inventory-cancel-button" onClick={() => setIsVoucherFormOpen(false)}>Hủy</button><button type="submit" className="admin-inventory-save-button">Lưu và cập nhật kho</button></footer>
            </form>
          </section>
        </div>
      ) : null}

      {selectedVoucher ? (
        <div className="admin-inventory-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedVoucher(null)}>
          <section className="admin-inventory-detail-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-voucher-detail-title">
            <header><div><span>CHI TIẾT PHIẾU KHO</span><h2 id="inventory-voucher-detail-title">{selectedVoucher.code}</h2><small>{formatDateTime(selectedVoucher.createdAt)}</small></div><button type="button" onClick={() => setSelectedVoucher(null)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <div className="admin-inventory-detail-content">
              <div className="admin-inventory-detail-meta"><p><span>Loại phiếu</span><strong className={`is-${selectedVoucher.type}`}>{selectedVoucher.type === 'in' ? 'Phiếu nhập kho' : 'Phiếu xuất kho'}</strong></p><p><span>Đối tác / Bộ phận</span><strong>{selectedVoucher.partner}</strong></p><p><span>Người tạo</span><strong>{selectedVoucher.createdBy}</strong></p><p><span>Ghi chú</span><strong>{selectedVoucher.note || 'Không có ghi chú'}</strong></p></div>
              <section><h3>Danh sách sản phẩm</h3><div>{selectedVoucher.items.map((item) => {
                const product = inventory.find((entry) => entry.id === item.productId)
                return <article key={item.productId}><img src={product?.image} alt="" /><div><strong>{product?.name}</strong><span>{product?.sku} · {item.quantity} {product?.unit} x {formatPrice(item.unitCost)}</span></div><b>{formatPrice(item.quantity * item.unitCost)}</b></article>
              })}</div></section>
              <footer><span>Tổng cộng <strong>{voucherQuantity(selectedVoucher)} sản phẩm</strong></span><b>{formatPrice(voucherTotal(selectedVoucher))}</b></footer>
            </div>
          </section>
        </div>
      ) : null}

      {notice ? <div className="admin-inventory-toast" role="status"><span>✓</span>{notice}</div> : null}
    </AdminLayout>
  )
}

export default AdminInventoryPage
