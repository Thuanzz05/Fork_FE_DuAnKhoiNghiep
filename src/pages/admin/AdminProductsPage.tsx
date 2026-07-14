import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import { categories, formatPrice, products, type Product } from '../../data/products'
import './AdminProductsPage.css'

type ProductStatus = 'active' | 'low' | 'out'

interface ManagedProduct extends Product {
  sku: string
  stock: number
}

interface ProductFormState {
  name: string
  nameEn: string
  categorySlug: string
  image: string
  price: string
  originalPrice: string
  weight: string
  origin: string
  stock: string
  description: string
  mainIngredients: string
  tags: string
  isCombo: boolean
}

const stockByProductId: Record<string, number> = {
  '1': 18,
  '2': 42,
  '3': 9,
  '4': 31,
  '5': 6,
  '6': 24,
  '7': 0,
  '8': 15,
}

const managedProducts: ManagedProduct[] = products.map((product) => ({
  ...product,
  sku: `RBN-${product.id.padStart(3, '0')}`,
  stock: stockByProductId[product.id] ?? 0,
}))

const productCategories = categories.filter((category) => category.slug !== 'tat-ca')

const emptyForm: ProductFormState = {
  name: '',
  nameEn: '',
  categorySlug: productCategories[0]?.slug ?? '',
  image: '',
  price: '',
  originalPrice: '',
  weight: '',
  origin: 'Việt Nam',
  stock: '0',
  description: '',
  mainIngredients: '',
  tags: '',
  isCombo: false,
}

const getProductStatus = (stock: number): ProductStatus => {
  if (stock === 0) return 'out'
  if (stock <= 10) return 'low'
  return 'active'
}

const statusMeta: Record<ProductStatus, { label: string }> = {
  active: { label: 'Đang bán' },
  low: { label: 'Sắp hết' },
  out: { label: 'Hết hàng' },
}

const splitCommaList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)

const makeSlug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

function AdminProductsPage() {
  const [productList, setProductList] = useState<ManagedProduct[]>(managedProducts)
  const [searchValue, setSearchValue] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all')
  const [editingProduct, setEditingProduct] = useState<ManagedProduct | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<ManagedProduct | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [toast, setToast] = useState('')
  const [selectedImageName, setSelectedImageName] = useState('')
  const imageFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!isFormOpen && !deletingProduct) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFormOpen(false)
        setDeletingProduct(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFormOpen, deletingProduct])

  const filteredProducts = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase('vi-VN')

    return productList.filter((product) => {
      const matchesKeyword = !keyword || [product.name, product.nameEn, product.sku, product.category]
        .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
      const matchesCategory = categoryFilter === 'all' || product.categorySlug === categoryFilter
      const matchesStatus = statusFilter === 'all' || getProductStatus(product.stock) === statusFilter
      return matchesKeyword && matchesCategory && matchesStatus
    })
  }, [categoryFilter, productList, searchValue, statusFilter])

  const activeCount = productList.filter((product) => product.stock > 10).length
  const lowStockCount = productList.filter((product) => product.stock > 0 && product.stock <= 10).length
  const inventoryValue = productList.reduce((total, product) => total + product.price * product.stock, 0)

  const openCreateForm = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setSelectedImageName('')
    setIsFormOpen(true)
  }

  const openEditForm = (product: ManagedProduct) => {
    setEditingProduct(product)
    setSelectedImageName('')
    setForm({
      name: product.name,
      nameEn: product.nameEn,
      categorySlug: product.categorySlug,
      image: product.image,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      weight: product.weight,
      origin: product.origin,
      stock: String(product.stock),
      description: product.description,
      mainIngredients: product.mainIngredients.join(', '),
      tags: product.tags.join(', '),
      isCombo: Boolean(product.isCombo),
    })
    setIsFormOpen(true)
  }

  const updateField = <K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setToast('Vui lòng chọn đúng định dạng ảnh')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      updateField('image', reader.result)
      setSelectedImageName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const selectedCategory = productCategories.find((category) => category.slug === form.categorySlug)
    if (!selectedCategory) return

    const price = Number(form.price)
    const originalPrice = Number(form.originalPrice) || undefined
    const discount = originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined

    if (editingProduct) {
      const updatedProduct: ManagedProduct = {
        ...editingProduct,
        name: form.name.trim(),
        nameEn: form.nameEn.trim(),
        slug: makeSlug(form.name),
        category: selectedCategory.name,
        categorySlug: selectedCategory.slug,
        image: form.image.trim(),
        price,
        originalPrice,
        discount,
        weight: form.weight.trim(),
        origin: form.origin.trim(),
        stock: Math.max(0, Number(form.stock)),
        description: form.description.trim(),
        mainIngredients: splitCommaList(form.mainIngredients),
        tags: splitCommaList(form.tags),
        isCombo: form.isCombo || undefined,
      }
      setProductList((current) => current.map((product) => product.id === editingProduct.id ? updatedProduct : product))
      setToast('Đã cập nhật sản phẩm thành công')
    } else {
      const nextId = String(Math.max(0, ...productList.map((product) => Number(product.id) || 0)) + 1)
      const newProduct: ManagedProduct = {
        id: nextId,
        sku: `RBN-${nextId.padStart(3, '0')}`,
        slug: `${makeSlug(form.name)}-${nextId}`,
        name: form.name.trim(),
        nameEn: form.nameEn.trim(),
        category: selectedCategory.name,
        categorySlug: selectedCategory.slug,
        image: form.image.trim(),
        price,
        originalPrice,
        discount,
        weight: form.weight.trim(),
        origin: form.origin.trim(),
        stock: Math.max(0, Number(form.stock)),
        description: form.description.trim(),
        mainIngredients: splitCommaList(form.mainIngredients),
        tags: splitCommaList(form.tags),
        isCombo: form.isCombo || undefined,
      }
      setProductList((current) => [newProduct, ...current])
      setToast('Đã thêm sản phẩm mới')
    }

    setIsFormOpen(false)
  }

  const confirmDelete = () => {
    if (!deletingProduct) return
    setProductList((current) => current.filter((product) => product.id !== deletingProduct.id))
    setToast(`Đã xóa ${deletingProduct.name}`)
    setDeletingProduct(null)
  }

  return (
    <AdminLayout
      activeItem="products"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder="Tìm tên hoặc mã sản phẩm..."
    >
      <div className="admin-page-heading admin-products-heading">
        <div>
          <p>QUẢN LÝ CỬA HÀNG</p>
          <h1>Quản lý sản phẩm</h1>
          <span>Theo dõi thông tin, giá bán và tồn kho của toàn bộ sản phẩm.</span>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreateForm}>
          <AdminIcon name="plus" />
          Thêm sản phẩm
        </button>
      </div>

      <section className="admin-product-summary" aria-label="Tổng quan sản phẩm">
        <article><span className="is-red"><AdminIcon name="products" /></span><div><small>Tổng sản phẩm</small><strong>{productList.length}</strong></div></article>
        <article><span className="is-green"><AdminIcon name="box" /></span><div><small>Đang bán</small><strong>{activeCount}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="filter" /></span><div><small>Sắp hết hàng</small><strong>{lowStockCount}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="revenue" /></span><div><small>Giá trị tồn kho</small><strong>{formatPrice(inventoryValue)}</strong></div></article>
      </section>

      <section className="admin-products-panel">
        <div className="admin-products-toolbar">
          <div>
            <label>
              <span>Danh mục</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Lọc theo danh mục">
                <option value="all">Tất cả danh mục</option>
                {productCategories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}
              </select>
            </label>
            <label>
              <span>Trạng thái</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ProductStatus)} aria-label="Lọc theo trạng thái">
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang bán</option>
                <option value="low">Sắp hết</option>
                <option value="out">Hết hàng</option>
              </select>
            </label>
          </div>
          <span>Hiển thị <strong>{filteredProducts.length}</strong> / {productList.length} sản phẩm</span>
        </div>

        <div className="admin-products-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Mã sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const status = getProductStatus(product.stock)
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-cell">
                        <img src={product.image} alt="" />
                        <div><strong>{product.name}</strong><span>{product.weight} · {product.origin}</span></div>
                      </div>
                    </td>
                    <td><span className="admin-product-sku">{product.sku}</span></td>
                    <td>{product.category}</td>
                    <td>
                      <div className="admin-product-price"><strong>{formatPrice(product.price)}</strong>{product.originalPrice ? <del>{formatPrice(product.originalPrice)}</del> : null}</div>
                    </td>
                    <td><span className={`admin-stock-value is-${status}`}>{product.stock}</span></td>
                    <td><span className={`admin-product-status is-${status}`}><i />{statusMeta[status].label}</span></td>
                    <td>
                      <div className="admin-product-actions">
                        <button type="button" onClick={() => openEditForm(product)} aria-label={`Sửa ${product.name}`} title="Sửa sản phẩm"><AdminIcon name="edit" /></button>
                        <button type="button" className="is-danger" onClick={() => setDeletingProduct(product)} aria-label={`Xóa ${product.name}`} title="Xóa sản phẩm"><AdminIcon name="trash" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 ? (
            <div className="admin-products-empty"><AdminIcon name="search" /><strong>Không tìm thấy sản phẩm</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div>
          ) : null}
        </div>
      </section>

      {isFormOpen ? (
        <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsFormOpen(false)}>
          <section className="admin-product-modal" role="dialog" aria-modal="true" aria-labelledby="admin-product-modal-title">
            <header>
              <div><span>{editingProduct ? editingProduct.sku : 'SẢN PHẨM MỚI'}</span><h2 id="admin-product-modal-title">{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h2></div>
              <button type="button" onClick={() => setIsFormOpen(false)} aria-label="Đóng"><AdminIcon name="close" /></button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="admin-product-form-grid">
                <label className="is-wide"><span>Tên sản phẩm *</span><input required value={form.name} onChange={(event) => updateField('name', event.target.value)} /></label>
                <label><span>Tên tiếng Anh *</span><input required value={form.nameEn} onChange={(event) => updateField('nameEn', event.target.value)} /></label>
                <label><span>Danh mục *</span><select required value={form.categorySlug} onChange={(event) => updateField('categorySlug', event.target.value)}>{productCategories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select></label>
                <label className="is-wide">
                  <span>Hình ảnh sản phẩm *</span>
                  <div className="admin-image-field">
                    {form.image ? <img src={form.image} alt="Xem trước sản phẩm" /> : <span><AdminIcon name="products" /></span>}
                    <div className="admin-image-source">
                      <input
                        required
                        placeholder="Nhập đường dẫn ảnh"
                        value={form.image}
                        onChange={(event) => {
                          updateField('image', event.target.value)
                          setSelectedImageName('')
                        }}
                      />
                      <button type="button" onClick={() => imageFileInputRef.current?.click()}>
                        <AdminIcon name="upload" />
                        Chọn ảnh từ máy
                      </button>
                      <input
                        ref={imageFileInputRef}
                        className="admin-hidden-file-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleImageFileChange}
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                  <small className="admin-image-hint">{selectedImageName ? `Đã chọn: ${selectedImageName}` : 'Có thể nhập đường dẫn hoặc chọn ảnh JPG, PNG, WEBP từ máy.'}</small>
                </label>
                <label><span>Giá bán *</span><input required min="0" type="number" value={form.price} onChange={(event) => updateField('price', event.target.value)} /></label>
                <label><span>Giá gốc</span><input min="0" type="number" value={form.originalPrice} onChange={(event) => updateField('originalPrice', event.target.value)} /></label>
                <label><span>Khối lượng / dung tích *</span><input required value={form.weight} onChange={(event) => updateField('weight', event.target.value)} /></label>
                <label><span>Xuất xứ *</span><input required value={form.origin} onChange={(event) => updateField('origin', event.target.value)} /></label>
                <label><span>Số lượng tồn kho *</span><input required min="0" type="number" value={form.stock} onChange={(event) => updateField('stock', event.target.value)} /></label>
                <label className="admin-checkbox-field"><input type="checkbox" checked={form.isCombo} onChange={(event) => updateField('isCombo', event.target.checked)} /><span>Đây là sản phẩm combo</span></label>
                <label className="is-wide"><span>Mô tả sản phẩm *</span><textarea required rows={4} value={form.description} onChange={(event) => updateField('description', event.target.value)} /></label>
                <label className="is-wide"><span>Thành phần chính</span><input placeholder="Phân tách bằng dấu phẩy" value={form.mainIngredients} onChange={(event) => updateField('mainIngredients', event.target.value)} /></label>
                <label className="is-wide"><span>Đặc điểm / thẻ sản phẩm</span><input placeholder="Phân tách bằng dấu phẩy" value={form.tags} onChange={(event) => updateField('tags', event.target.value)} /></label>
              </div>
              <footer><button type="button" className="admin-secondary-button" onClick={() => setIsFormOpen(false)}>Hủy</button><button type="submit" className="admin-primary-button">{editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</button></footer>
            </form>
          </section>
        </div>
      ) : null}

      {deletingProduct ? (
        <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDeletingProduct(null)}>
          <section className="admin-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="admin-delete-title">
            <span><AdminIcon name="trash" /></span>
            <h2 id="admin-delete-title">Xóa sản phẩm?</h2>
            <p>Bạn sắp xóa <strong>{deletingProduct.name}</strong>. Thao tác này chỉ áp dụng tạm thời trên frontend.</p>
            <div><button type="button" className="admin-secondary-button" onClick={() => setDeletingProduct(null)}>Hủy</button><button type="button" className="admin-danger-button" onClick={confirmDelete}>Xóa sản phẩm</button></div>
          </section>
        </div>
      ) : null}

      {toast ? <div className="admin-product-toast" role="status"><span>✓</span>{toast}</div> : null}
    </AdminLayout>
  )
}

export default AdminProductsPage
