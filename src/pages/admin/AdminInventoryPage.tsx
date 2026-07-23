import { Fragment, useEffect, useMemo, useState, type FormEvent } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import Pagination from '../../components/Pagination'
import { formatPrice } from '../../data/products'
import { usePagination } from '../../hooks/usePagination'
import { api } from '../../services/api'
import './AdminInventoryPage.css'

type InventoryView = 'stock' | 'vouchers'
type StockStatus = 'good' | 'low' | 'out'
type VoucherType = 'in' | 'out'
type VoucherStatus = 'NHAP_TAM' | 'DA_HOAN_THANH' | 'DA_HUY'
type VoucherMovementType = 'NHAP_HANG' | 'BAN_HANG' | 'XUAT_HUY' | 'XUAT_KHAC'
type ManualExportType = 'XUAT_HUY' | 'XUAT_KHAC'
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
  reservedStock: number
  availableStock: number
  minimumStock: number
  costPrice: number
  location: string
  updatedAt: string
}

interface VoucherItem {
  productId: string
  sku: string
  productName: string
  image: string
  unit: string
  quantity: number
  unitCost: number
  total: number
}

interface StockVoucher {
  id: string
  code: string
  type: VoucherType
  movementType: VoucherMovementType
  status: VoucherStatus
  orderCode?: string
  createdAt: string
  partner: string
  note: string
  createdBy: string
  items: VoucherItem[]
  quantity: number
  total: number
}

interface VoucherLineForm {
  id: string
  productId: string
  quantity: string
  unitCost: string
}

interface VoucherFormState {
  type: VoucherType
  exportType: ManualExportType
  date: string
  supplierId: string
  partner: string
  note: string
  lines: VoucherLineForm[]
}

interface Supplier {
  id: string
  code: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  note?: string
  status?: 'HOAT_DONG' | 'NGUNG_HOP_TAC'
}

interface SupplierFormState {
  name: string
  contactName: string
  phone: string
  email: string
  address: string
  note: string
  status: 'HOAT_DONG' | 'NGUNG_HOP_TAC'
}

const initialInventory: InventoryProduct[] = []
const initialVouchers: StockVoucher[] = []
const emptySupplierForm: SupplierFormState = {
  name: '', contactName: '', phone: '', email: '', address: '', note: '', status: 'HOAT_DONG',
}

const stockStatusMeta: Record<StockStatus, { label: string; tone: string }> = {
  good: { label: 'Tồn ổn định', tone: 'good' },
  low: { label: 'Sắp hết', tone: 'low' },
  out: { label: 'Hết hàng', tone: 'out' },
}

const voucherStatusMeta: Record<VoucherStatus, { label: string; tone: string }> = {
  NHAP_TAM: { label: 'Phiếu nháp', tone: 'draft' },
  DA_HOAN_THANH: { label: 'Đã hoàn thành', tone: 'completed' },
  DA_HUY: { label: 'Đã hủy', tone: 'cancelled' },
}

const voucherMovementMeta: Record<VoucherMovementType, { label: string; tone: string }> = {
  NHAP_HANG: { label: 'Nhập hàng', tone: 'in' },
  BAN_HANG: { label: 'Xuất bán hàng', tone: 'sale' },
  XUAT_HUY: { label: 'Xuất hủy', tone: 'waste' },
  XUAT_KHAC: { label: 'Xuất khác', tone: 'other' },
}

const getStockStatus = (product: InventoryProduct): StockStatus => {
  if (product.availableStock <= 0) return 'out'
  if (product.availableStock <= product.minimumStock) return 'low'
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
  const [voucherStatusFilter, setVoucherStatusFilter] = useState<'all' | VoucherStatus>('all')
  const [voucherPeriod, setVoucherPeriod] = useState<VoucherPeriod>('all')
  const [voucherSort, setVoucherSort] = useState<VoucherSort>('newest')
  const [isVoucherFormOpen, setIsVoucherFormOpen] = useState(false)
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false)
  const [isSupplierSaving, setIsSupplierSaving] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<StockVoucher | null>(null)
  const [notice, setNotice] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(emptySupplierForm)
  const [voucherForm, setVoucherForm] = useState<VoucherFormState>(() => ({
    type: 'in', exportType: 'XUAT_KHAC', date: toDateInput(), supplierId: '', partner: '', note: '', lines: [],
  }))

  const loadInventory = async () => {
    try {
      const data = await api.get<{
        products: Array<Record<string, any>>; suppliers: Supplier[]
        imports: Array<Record<string, any>>; exports: Array<Record<string, any>>
      }>('/admin/inventory')
      setInventory(data.products.map((item) => ({
        id: String(item.id), sku: String(item.sku), name: String(item.name), image: String(item.image || ''),
        category: String(item.category || 'Chưa phân loại'), categorySlug: String(item.categorySlug || ''),
        unit: String(item.unit || 'Sản phẩm'), stock: Number(item.stock),
        reservedStock: Number(item.reservedStock), availableStock: Number(item.availableStock),
        minimumStock: Number(item.minimumStock), costPrice: Number(item.costPrice), location: 'Kho chính',
        updatedAt: String(item.updatedAt || ''),
      })))
      setSuppliers(data.suppliers)
      const mapItems = (items: Array<Record<string, any>> = []): VoucherItem[] => items.map((item) => ({
        productId: String(item.productId), sku: String(item.sku || ''),
        productName: String(item.productName || 'Sản phẩm không còn tồn tại'), image: String(item.image || ''),
        unit: String(item.unit || 'Sản phẩm'), quantity: Number(item.quantity),
        unitCost: Number(item.unitCost), total: Number(item.total),
      }))
      const imports = data.imports.map((item) => ({
        id: `import-${String(item.id)}`, code: String(item.code), type: 'in' as const,
        movementType: 'NHAP_HANG' as const, status: item.status as VoucherStatus, createdAt: String(item.date),
        partner: String(item.supplierName || ''), note: String(item.note || ''), createdBy: String(item.createdBy || ''),
        items: mapItems(item.items), quantity: Number(item.quantity), total: Number(item.total),
      }))
      const exports = data.exports.map((item) => ({
        id: `export-${String(item.id)}`, code: String(item.code), type: 'out' as const,
        movementType: item.type as Exclude<VoucherMovementType, 'NHAP_HANG'>,
        status: (['NHAP_TAM', 'DA_HOAN_THANH', 'DA_HUY'].includes(String(item.status)) ? item.status : 'NHAP_TAM') as VoucherStatus,
        orderCode: item.orderCode ? String(item.orderCode) : undefined,
        createdAt: String(item.date),
        partner: String(item.recipient || ''), note: String(item.note || ''), createdBy: String(item.createdBy || ''),
        items: mapItems(item.items), quantity: Number(item.quantity), total: Number(item.total),
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
    if (!isVoucherFormOpen && !isSupplierFormOpen && !selectedVoucher) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isSupplierFormOpen) {
          setIsSupplierFormOpen(false)
          return
        }
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
  }, [isSupplierFormOpen, isVoucherFormOpen, selectedVoucher])

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
        if (stockSort === 'stock-asc') return a.availableStock - b.availableStock
        if (stockSort === 'stock-desc') return b.availableStock - a.availableStock
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
        const productNames = voucher.items.map((item) => item.productName)
        const matchesSearch = !keyword || [voucher.code, voucher.partner, voucher.createdBy, ...productNames]
          .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
        const matchesType = voucherTypeFilter === 'all' || voucher.type === voucherTypeFilter
        const matchesStatus = voucherStatusFilter === 'all' || voucher.status === voucherStatusFilter
        const ageInDays = (now.getTime() - new Date(voucher.createdAt).getTime()) / 86400000
        const matchesPeriod = periodDays === null || ageInDays <= periodDays
        return matchesSearch && matchesType && matchesStatus && matchesPeriod
      })
      .sort((a, b) => {
        if (voucherSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        if (voucherSort === 'quantity') {
          const quantityA = a.quantity
          const quantityB = b.quantity
          return quantityB - quantityA
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [searchValue, voucherPeriod, voucherSort, voucherStatusFilter, voucherTypeFilter, vouchers])

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
  } = usePagination(filteredVouchers, 6, `${searchValue}|${voucherTypeFilter}|${voucherStatusFilter}|${voucherPeriod}|${voucherSort}`)

  const inventoryCategories = Array.from(new Map(inventory.filter((item) => item.categorySlug).map((item) => [item.categorySlug, item.category])).entries())

  const totalStock = inventory.reduce((total, product) => total + product.stock, 0)
  const replenishmentCount = inventory.filter((product) => product.availableStock <= product.minimumStock).length
  const inventoryValue = inventory.reduce((total, product) => total + product.stock * product.costPrice, 0)

  const openVoucherForm = (type: VoucherType) => {
    const firstProduct = inventory[0]
    if (!firstProduct) {
      setNotice('Chưa có sản phẩm để tạo phiếu kho')
      return
    }
    const activeSupplier = suppliers.find((supplier) => supplier.status !== 'NGUNG_HOP_TAC')
    setVoucherForm({
      type, exportType: 'XUAT_KHAC', date: toDateInput(), supplierId: activeSupplier?.id ?? '',
      partner: '', note: '', lines: [createVoucherLine(firstProduct)],
    })
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

  const openSupplierForm = () => {
    setSupplierForm(emptySupplierForm)
    setIsSupplierFormOpen(true)
  }

  const handleSupplierSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSupplierSaving(true)
    try {
      const created = await api.post<{ id: string }>('/admin/suppliers', {
        name: supplierForm.name.trim(),
        contactName: supplierForm.contactName.trim() || null,
        phone: supplierForm.phone.trim() || null,
        email: supplierForm.email.trim() || null,
        address: supplierForm.address.trim() || null,
        note: supplierForm.note.trim() || null,
        status: supplierForm.status,
      })
      await loadInventory()
      if (supplierForm.status === 'HOAT_DONG') {
        setVoucherForm((current) => ({ ...current, supplierId: created.id }))
      }
      setIsSupplierFormOpen(false)
      setNotice(supplierForm.status === 'HOAT_DONG'
        ? `Đã thêm và chọn nhà cung cấp ${supplierForm.name.trim()}`
        : `Đã thêm nhà cung cấp ${supplierForm.name.trim()} ở trạng thái ngừng hợp tác`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể tạo nhà cung cấp')
    } finally {
      setIsSupplierSaving(false)
    }
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
    if (parsedItems.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0
      || (voucherForm.type === 'in' && (!Number.isFinite(item.unitCost) || item.unitCost < 0)))) {
      setNotice('Số lượng hoặc đơn giá trong phiếu không hợp lệ')
      return
    }
    const uniqueIds = new Set(parsedItems.map((item) => item.productId))
    if (uniqueIds.size !== parsedItems.length) {
      setNotice('Mỗi sản phẩm chỉ được xuất hiện một lần trong phiếu')
      return
    }
    if (voucherForm.type === 'out') {
      const insufficientItem = parsedItems.find((item) => {
        const product = inventory.find((entry) => entry.id === item.productId)
        return !product || item.quantity > product.availableStock
      })
      if (insufficientItem) {
        const product = inventory.find((entry) => entry.id === insufficientItem.productId)
        setNotice(`${product?.name ?? 'Sản phẩm'} không đủ tồn kho để xuất`)
        return
      }
    }

    try {
      let created: { code: string }
      if (voucherForm.type === 'in') {
        const supplier = suppliers.find((item) => item.id === voucherForm.supplierId && item.status !== 'NGUNG_HOP_TAC')
        if (!supplier) {
          setNotice('Vui lòng chọn nhà cung cấp đang hoạt động')
          return
        }
        created = await api.post<{ code: string }>('/admin/imports', {
          supplierId: supplier.id, date: voucherForm.date,
          note: voucherForm.note.trim(),
          items: parsedItems.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.unitCost })),
        })
      } else {
        created = await api.post<{ code: string }>('/admin/exports', {
          type: voucherForm.exportType, date: voucherForm.date,
          recipient: voucherForm.partner.trim(), note: voucherForm.note.trim(),
          items: parsedItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        })
      }
      await loadInventory()
      setIsVoucherFormOpen(false)
      setActiveView('vouchers')
      setNotice(`Đã tạo ${voucherForm.type === 'in' ? 'phiếu nhập' : 'phiếu xuất'} ${created.code}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể tạo phiếu kho')
    }
  }

  const voucherTotal = (voucher: StockVoucher) => voucher.total
  const voucherQuantity = (voucher: StockVoucher) => voucher.quantity

  return (
    <AdminLayout
      activeItem="inventory"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder={activeView === 'stock' ? 'Tìm tên sản phẩm, SKU, vị trí kho...' : 'Tìm mã phiếu, đối tác, người tạo...'}
    >
      <div className="admin-page-heading admin-inventory-heading">
        <div><p>QUẢN LÝ VẬN HÀNH</p><h1>Quản lý kho</h1><span>Theo dõi tồn hàng và 100 phiếu nhập, xuất gần nhất.</span></div>
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
          <Fragment key="stock-view">
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
                <thead><tr><th>Sản phẩm</th><th>Vị trí</th><th>Giá vốn</th><th>Tồn vật lý</th><th>Giữ chỗ</th><th>Khả dụng</th><th>Tồn tối thiểu</th><th>Trạng thái</th></tr></thead>
                <tbody>{paginatedInventory.map((product) => {
                  const status = stockStatusMeta[getStockStatus(product)]
                  return <tr key={`stock-${product.id}`}>
                    <td><div className="admin-inventory-product"><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>{product.sku} · {product.category}</span></div></div></td>
                    <td><div className="admin-inventory-location"><strong>{product.location}</strong><span>Kho chính</span></div></td>
                    <td>{formatPrice(product.costPrice)}</td>
                    <td><strong className="admin-inventory-stock-number">{product.stock}</strong></td>
                    <td><strong>{product.reservedStock}</strong></td>
                    <td><strong className="admin-inventory-stock-number">{product.availableStock}</strong></td>
                    <td>{product.minimumStock}</td>
                    <td><span className={`admin-inventory-status is-${status.tone}`}><i />{status.label}</span></td>
                  </tr>
                })}</tbody>
              </table>
              {filteredInventory.length === 0 ? <div className="admin-inventory-empty"><AdminIcon name="search" /><strong>Không tìm thấy sản phẩm</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}
            </div>
            <Pagination currentPage={inventoryPage} totalPages={inventoryTotalPages} totalItems={filteredInventory.length} pageSize={6} itemLabel="sản phẩm" onPageChange={setInventoryPage} />
          </Fragment>
        ) : (
          <Fragment key="voucher-view">
            <div className="admin-inventory-toolbar">
              <div>
                <label><span>Loại phiếu</span><select value={voucherTypeFilter} onChange={(event) => setVoucherTypeFilter(event.target.value as 'all' | VoucherType)} aria-label="Lọc loại phiếu kho"><option value="all">Tất cả phiếu</option><option value="in">Phiếu nhập</option><option value="out">Phiếu xuất</option></select></label>
                <label><span>Trạng thái</span><select value={voucherStatusFilter} onChange={(event) => setVoucherStatusFilter(event.target.value as 'all' | VoucherStatus)} aria-label="Lọc trạng thái phiếu kho"><option value="all">Tất cả trạng thái</option><option value="DA_HOAN_THANH">Đã hoàn thành</option><option value="NHAP_TAM">Phiếu nháp</option><option value="DA_HUY">Đã hủy</option></select></label>
                <label><span>Thời gian</span><select value={voucherPeriod} onChange={(event) => setVoucherPeriod(event.target.value as VoucherPeriod)} aria-label="Lọc thời gian phiếu kho"><option value="all">Tất cả thời gian</option><option value="7days">7 ngày gần đây</option><option value="30days">30 ngày gần đây</option></select></label>
                <label><span>Sắp xếp</span><select value={voucherSort} onChange={(event) => setVoucherSort(event.target.value as VoucherSort)} aria-label="Sắp xếp phiếu kho"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="quantity">Số lượng nhiều nhất</option></select></label>
              </div>
              <span>Hiển thị <strong>{filteredVouchers.length}</strong> / {vouchers.length} phiếu</span>
            </div>
            <div className="admin-inventory-table-wrap">
              <table className="admin-inventory-voucher-table">
                <thead><tr><th>Mã phiếu</th><th>Loại</th><th>Trạng thái</th><th>Đối tác / Bộ phận</th><th>Sản phẩm</th><th>Số lượng</th><th>Giá trị phiếu</th><th>Người tạo</th><th>Thao tác</th></tr></thead>
                <tbody>{paginatedVouchers.map((voucher) => {
                  const firstProduct = voucher.items[0]
                  const movement = voucherMovementMeta[voucher.movementType]
                  const voucherStatus = voucherStatusMeta[voucher.status]
                  return <tr key={voucher.id}>
                    <td><div className="admin-inventory-voucher-code"><strong>{voucher.code}</strong><span>{formatDateTime(voucher.createdAt)}</span></div></td>
                    <td><span className={`admin-inventory-voucher-type is-${movement.tone}`}>{movement.label}</span></td>
                    <td><span className={`admin-inventory-voucher-status is-${voucherStatus.tone}`}><i />{voucherStatus.label}</span></td>
                    <td><div className="admin-inventory-partner"><strong>{voucher.partner}</strong><span>{voucher.note || 'Không có ghi chú'}</span></div></td>
                    <td><div className="admin-inventory-voucher-product"><img src={firstProduct?.image} alt="" /><div><strong>{firstProduct?.productName ?? 'Không có sản phẩm'}</strong><span>{voucher.items.length > 1 ? `+${voucher.items.length - 1} sản phẩm khác` : `${voucher.items.length} sản phẩm`}</span></div></div></td>
                    <td><strong>{voucherQuantity(voucher)}</strong></td>
                    <td><strong>{formatPrice(voucherTotal(voucher))}</strong></td>
                    <td>{voucher.createdBy || 'Hệ thống'}</td>
                    <td><button type="button" className="admin-inventory-view-button" onClick={() => setSelectedVoucher(voucher)} aria-label={`Xem phiếu ${voucher.code}`} title="Xem chi tiết phiếu"><AdminIcon name="eye" /></button></td>
                  </tr>
                })}</tbody>
              </table>
              {filteredVouchers.length === 0 ? <div className="admin-inventory-empty"><AdminIcon name="search" /><strong>Không tìm thấy phiếu kho</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}
            </div>
            <Pagination currentPage={voucherPage} totalPages={voucherTotalPages} totalItems={filteredVouchers.length} pageSize={6} itemLabel="phiếu" onPageChange={setVoucherPage} />
          </Fragment>
        )}
      </section>

      {isVoucherFormOpen ? (
        <div className="admin-inventory-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsVoucherFormOpen(false)}>
          <section className="admin-inventory-voucher-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-voucher-form-title">
            <header><div><span>LẬP PHIẾU KHO</span><h2 id="inventory-voucher-form-title">{voucherForm.type === 'in' ? 'Tạo phiếu nhập kho' : 'Tạo phiếu xuất kho'}</h2></div><button type="button" onClick={() => setIsVoucherFormOpen(false)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <form onSubmit={handleVoucherSubmit}>
              <div className="admin-inventory-voucher-form-head">
                <div className="admin-inventory-type-switch"><button type="button" className={voucherForm.type === 'in' ? 'is-active' : ''} onClick={() => setVoucherForm((current) => ({ ...current, type: 'in', supplierId: current.supplierId || suppliers.find((supplier) => supplier.status !== 'NGUNG_HOP_TAC')?.id || '' }))}>Phiếu nhập</button><button type="button" className={voucherForm.type === 'out' ? 'is-active' : ''} onClick={() => setVoucherForm((current) => ({ ...current, type: 'out' }))}>Phiếu xuất ngoài bán hàng</button></div>
                <label><span>Ngày lập phiếu *</span><input type="date" required value={voucherForm.date} onChange={(event) => setVoucherForm((current) => ({ ...current, date: event.target.value }))} /></label>
                {voucherForm.type === 'in' ? <div className="admin-inventory-supplier-field"><label><span>Nhà cung cấp *</span><select required value={voucherForm.supplierId} onChange={(event) => setVoucherForm((current) => ({ ...current, supplierId: event.target.value }))}><option value="" disabled>Chọn nhà cung cấp</option>{suppliers.filter((supplier) => supplier.status !== 'NGUNG_HOP_TAC').map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.code} - {supplier.name}</option>)}</select></label><button type="button" onClick={openSupplierForm}><AdminIcon name="plus" />Thêm nhanh nhà cung cấp</button></div> : <label><span>Loại xuất *</span><select value={voucherForm.exportType} onChange={(event) => setVoucherForm((current) => ({ ...current, exportType: event.target.value as ManualExportType }))}><option value="XUAT_HUY">Xuất hủy hàng lỗi / hết hạn</option><option value="XUAT_KHAC">Xuất dùng nội bộ / mục đích khác</option></select></label>}
                {voucherForm.type === 'out' ? <label className="is-wide"><span>Bộ phận hoặc nơi nhận *</span><input required value={voucherForm.partner} placeholder="Ví dụ: Bộ phận kiểm nghiệm, kho hủy" onChange={(event) => setVoucherForm((current) => ({ ...current, partner: event.target.value }))} /></label> : null}
                <label className="is-wide"><span>{voucherForm.type === 'out' ? 'Lý do xuất kho *' : 'Ghi chú'}</span><input required={voucherForm.type === 'out'} value={voucherForm.note} placeholder={voucherForm.type === 'out' ? 'Nhập lý do cụ thể để lưu lịch sử kho' : 'Nội dung bổ sung cho phiếu nhập'} onChange={(event) => setVoucherForm((current) => ({ ...current, note: event.target.value }))} /></label>
              </div>
              <section className="admin-inventory-voucher-lines">
                <header><div><h3>Sản phẩm trong phiếu</h3><span>{voucherForm.lines.length} dòng sản phẩm</span></div><button type="button" onClick={addVoucherLine}><AdminIcon name="plus" />Thêm sản phẩm</button></header>
                <div>{voucherForm.lines.map((line) => {
                  const selectedProduct = inventory.find((product) => product.id === line.productId)
                  return <article key={line.id}>
                    <label><span>Sản phẩm *</span><select value={line.productId} onChange={(event) => updateVoucherLine(line.id, 'productId', event.target.value)}>{inventory.map((product) => <option value={product.id} key={product.id}>{product.sku} - {product.name}</option>)}</select></label>
                    <label><span>Số lượng *</span><input type="number" required min="1" value={line.quantity} onChange={(event) => updateVoucherLine(line.id, 'quantity', event.target.value)} /></label>
                    {voucherForm.type === 'in' ? <label><span>Đơn giá nhập *</span><input type="number" required min="0" value={line.unitCost} onChange={(event) => updateVoucherLine(line.id, 'unitCost', event.target.value)} /></label> : <div><span>Giá vốn hệ thống</span><strong>{formatPrice(selectedProduct?.costPrice ?? 0)}</strong></div>}
                    <div><span>{voucherForm.type === 'out' ? 'Tồn khả dụng' : 'Tồn vật lý'}</span><strong>{voucherForm.type === 'out' ? selectedProduct?.availableStock ?? 0 : selectedProduct?.stock ?? 0} {selectedProduct?.unit}</strong></div>
                    <button type="button" disabled={voucherForm.lines.length === 1} onClick={() => removeVoucherLine(line.id)} aria-label={`Xóa dòng ${selectedProduct?.name ?? ''}`}><AdminIcon name="trash" /></button>
                  </article>
                })}</div>
              </section>
              <footer><div><span>Tổng số lượng</span><strong>{voucherForm.lines.reduce((total, line) => total + (Number(line.quantity) || 0), 0)} sản phẩm</strong></div><button type="button" className="admin-inventory-cancel-button" onClick={() => setIsVoucherFormOpen(false)}>Hủy</button><button type="submit" className="admin-inventory-save-button">Lưu và cập nhật kho</button></footer>
            </form>
          </section>
        </div>
      ) : null}

      {isSupplierFormOpen ? (
        <div className="admin-inventory-modal-backdrop admin-inventory-supplier-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsSupplierFormOpen(false)}>
          <section className="admin-inventory-supplier-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-supplier-form-title">
            <header><div><span>NHÀ CUNG CẤP</span><h2 id="inventory-supplier-form-title">Thêm nhanh nhà cung cấp</h2><small>Mã nhà cung cấp được tạo tự động</small></div><button type="button" onClick={() => setIsSupplierFormOpen(false)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <form onSubmit={handleSupplierSubmit}>
              <div className="admin-inventory-supplier-grid">
                <label className="is-wide"><span>Tên nhà cung cấp *</span><input required maxLength={200} value={supplierForm.name} onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))} /></label>
                <label><span>Người liên hệ</span><input maxLength={150} value={supplierForm.contactName} onChange={(event) => setSupplierForm((current) => ({ ...current, contactName: event.target.value }))} /></label>
                <label><span>Số điện thoại</span><input type="tel" maxLength={20} value={supplierForm.phone} onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value }))} /></label>
                <label><span>Email</span><input type="email" maxLength={150} value={supplierForm.email} onChange={(event) => setSupplierForm((current) => ({ ...current, email: event.target.value }))} /></label>
                <label><span>Trạng thái</span><select value={supplierForm.status} onChange={(event) => setSupplierForm((current) => ({ ...current, status: event.target.value as SupplierFormState['status'] }))}><option value="HOAT_DONG">Đang hợp tác</option><option value="NGUNG_HOP_TAC">Ngừng hợp tác</option></select></label>
                <label className="is-wide"><span>Địa chỉ</span><input maxLength={500} value={supplierForm.address} onChange={(event) => setSupplierForm((current) => ({ ...current, address: event.target.value }))} /></label>
                <label className="is-wide"><span>Ghi chú</span><textarea rows={3} value={supplierForm.note} onChange={(event) => setSupplierForm((current) => ({ ...current, note: event.target.value }))} /></label>
              </div>
              <footer><button type="button" className="admin-inventory-cancel-button" onClick={() => setIsSupplierFormOpen(false)}>Hủy</button><button type="submit" className="admin-inventory-save-button" disabled={isSupplierSaving}>{isSupplierSaving ? 'Đang lưu...' : 'Lưu nhà cung cấp'}</button></footer>
            </form>
          </section>
        </div>
      ) : null}

      {selectedVoucher ? (
        <div className="admin-inventory-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedVoucher(null)}>
          <section className="admin-inventory-detail-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-voucher-detail-title">
            <header><div><span>CHI TIẾT PHIẾU KHO</span><h2 id="inventory-voucher-detail-title">{selectedVoucher.code}</h2><small>{formatDateTime(selectedVoucher.createdAt)}</small></div><button type="button" onClick={() => setSelectedVoucher(null)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <div className="admin-inventory-detail-content">
              <div className="admin-inventory-detail-meta"><p><span>Loại phiếu</span><strong>{voucherMovementMeta[selectedVoucher.movementType].label}</strong></p><p><span>Trạng thái</span><strong>{voucherStatusMeta[selectedVoucher.status].label}</strong></p><p><span>Đối tác / Bộ phận</span><strong>{selectedVoucher.partner || 'Không có'}</strong></p><p><span>Người tạo</span><strong>{selectedVoucher.createdBy || 'Hệ thống'}</strong></p>{selectedVoucher.orderCode ? <p><span>Đơn hàng liên quan</span><strong>{selectedVoucher.orderCode}</strong></p> : null}<p><span>Ghi chú</span><strong>{selectedVoucher.note || 'Không có ghi chú'}</strong></p></div>
              <section><h3>Danh sách sản phẩm</h3><div>{selectedVoucher.items.map((item) => {
                return <article key={item.productId}><img src={item.image} alt="" /><div><strong>{item.productName}</strong><span>{item.sku} · {item.quantity} {item.unit} x {formatPrice(item.unitCost)}</span></div><b>{formatPrice(item.total)}</b></article>
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
