import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import { categories, products } from '../../data/products'
import './AdminCategoriesPage.css'

type CategoryStatus = 'active' | 'hidden'
type CategorySort = 'order' | 'name' | 'products'

interface ManagedCategory {
  id: string
  name: string
  slug: string
  description: string
  image: string
  status: CategoryStatus
  displayOrder: number
  createdAt: string
}

interface CategoryFormState {
  name: string
  slug: string
  description: string
  image: string
  status: CategoryStatus
  displayOrder: string
}

const categoryDescriptions: Record<string, string> = {
  'sua-rua-mat': 'Các sản phẩm làm sạch dịu nhẹ, hỗ trợ loại bỏ bụi bẩn và bã nhờn trên da.',
  'mat-na': 'Mặt nạ đậu đỏ giúp làm sạch tế bào chết, dưỡng ẩm và hỗ trợ làm sáng da.',
  toner: 'Sản phẩm cân bằng, làm dịu và bổ sung độ ẩm cho làn da sau bước làm sạch.',
  combo: 'Bộ sản phẩm chăm sóc da kết hợp nhiều bước, phù hợp dùng hằng ngày hoặc làm quà tặng.',
}

const seedCategories: ManagedCategory[] = categories
  .filter((category) => category.slug !== 'tat-ca')
  .map((category, index) => ({
    id: `category-${index + 1}`,
    name: category.name,
    slug: category.slug,
    description: categoryDescriptions[category.slug] ?? '',
    image: products.find((product) => product.categorySlug === category.slug)?.image ?? '',
    status: 'active',
    displayOrder: index + 1,
    createdAt: `2026-01-${String(index + 8).padStart(2, '0')}T08:00:00.000Z`,
  }))

const emptyForm: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
  image: '',
  status: 'active',
  displayOrder: String(seedCategories.length + 1),
}

const makeSlug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date(value))

function AdminCategoriesPage() {
  const [categoryList, setCategoryList] = useState<ManagedCategory[]>(seedCategories)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CategoryStatus>('all')
  const [sortBy, setSortBy] = useState<CategorySort>('order')
  const [editingCategory, setEditingCategory] = useState<ManagedCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<ManagedCategory | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [selectedImageName, setSelectedImageName] = useState('')
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const imageFileInputRef = useRef<HTMLInputElement>(null)

  const getProductCount = (slug: string) => products.filter((product) => product.categorySlug === slug).length

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!isFormOpen && !deletingCategory) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFormOpen(false)
        setDeletingCategory(null)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [deletingCategory, isFormOpen])

  const filteredCategories = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase('vi-VN')
    const result = categoryList.filter((category) => {
      const matchesKeyword = !keyword || [category.name, category.slug, category.description]
        .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
      const matchesStatus = statusFilter === 'all' || category.status === statusFilter
      return matchesKeyword && matchesStatus
    })

    return result.sort((first, second) => {
      if (sortBy === 'name') return first.name.localeCompare(second.name, 'vi')
      if (sortBy === 'products') return getProductCount(second.slug) - getProductCount(first.slug)
      return first.displayOrder - second.displayOrder
    })
  }, [categoryList, searchValue, sortBy, statusFilter])

  const activeCount = categoryList.filter((category) => category.status === 'active').length
  const hiddenCount = categoryList.length - activeCount
  const assignedProductCount = products.filter((product) => categoryList.some((category) => category.slug === product.categorySlug)).length
  const editingCategoryProductCount = editingCategory ? getProductCount(editingCategory.slug) : 0

  const openCreateForm = () => {
    setEditingCategory(null)
    setForm({ ...emptyForm, displayOrder: String(categoryList.length + 1) })
    setSelectedImageName('')
    setIsSlugManuallyEdited(false)
    setIsFormOpen(true)
  }

  const openEditForm = (category: ManagedCategory) => {
    setEditingCategory(category)
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      status: category.status,
      displayOrder: String(category.displayOrder),
    })
    setSelectedImageName('')
    setIsSlugManuallyEdited(true)
    setIsFormOpen(true)
  }

  const updateField = <K extends keyof CategoryFormState>(field: K, value: CategoryFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: isSlugManuallyEdited ? current.slug : makeSlug(value),
    }))
  }

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotice({ message: 'Vui lòng chọn đúng định dạng ảnh', type: 'error' })
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ message: 'Ảnh danh mục không được vượt quá 5MB', type: 'error' })
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
    const normalizedSlug = makeSlug(form.slug)
    const duplicatedSlug = categoryList.some((category) => category.slug === normalizedSlug && category.id !== editingCategory?.id)
    if (!normalizedSlug) {
      setNotice({ message: 'Đường dẫn danh mục chưa hợp lệ', type: 'error' })
      return
    }
    if (duplicatedSlug) {
      setNotice({ message: 'Đường dẫn này đã được một danh mục khác sử dụng', type: 'error' })
      return
    }

    if (editingCategory) {
      setCategoryList((current) => current.map((category) => category.id === editingCategory.id ? {
        ...category,
        name: form.name.trim(),
        slug: normalizedSlug,
        description: form.description.trim(),
        image: form.image.trim(),
        status: form.status,
        displayOrder: Math.max(1, Number(form.displayOrder) || 1),
      } : category))
      setNotice({ message: `Đã cập nhật danh mục “${form.name.trim()}”`, type: 'success' })
    } else {
      const newCategory: ManagedCategory = {
        id: `category-${Date.now()}`,
        name: form.name.trim(),
        slug: normalizedSlug,
        description: form.description.trim(),
        image: form.image.trim(),
        status: form.status,
        displayOrder: Math.max(1, Number(form.displayOrder) || categoryList.length + 1),
        createdAt: new Date().toISOString(),
      }
      setCategoryList((current) => [...current, newCategory])
      setNotice({ message: `Đã thêm danh mục “${newCategory.name}”`, type: 'success' })
    }
    setIsFormOpen(false)
  }

  const toggleStatus = (category: ManagedCategory) => {
    const nextStatus: CategoryStatus = category.status === 'active' ? 'hidden' : 'active'
    setCategoryList((current) => current.map((item) => item.id === category.id ? { ...item, status: nextStatus } : item))
    setNotice({
      message: nextStatus === 'active' ? `Đã hiển thị danh mục “${category.name}”` : `Đã ẩn danh mục “${category.name}”`,
      type: 'success',
    })
  }

  const requestDelete = (category: ManagedCategory) => {
    const productCount = getProductCount(category.slug)
    if (productCount > 0) {
      setNotice({ message: `Không thể xóa: danh mục đang có ${productCount} sản phẩm`, type: 'error' })
      return
    }
    setDeletingCategory(category)
  }

  const confirmDelete = () => {
    if (!deletingCategory) return
    setCategoryList((current) => current.filter((category) => category.id !== deletingCategory.id))
    setNotice({ message: `Đã xóa danh mục “${deletingCategory.name}”`, type: 'success' })
    setDeletingCategory(null)
  }

  return (
    <AdminLayout activeItem="categories" searchValue={searchValue} onSearchChange={setSearchValue} searchPlaceholder="Tìm tên hoặc đường dẫn danh mục...">
      <div className="admin-page-heading admin-categories-heading">
        <div><p>PHÂN LOẠI SẢN PHẨM</p><h1>Quản lý danh mục</h1><span>Sắp xếp nhóm sản phẩm hiển thị trên cửa hàng.</span></div>
        <button type="button" className="admin-category-primary" onClick={openCreateForm}><AdminIcon name="plus" />Thêm danh mục</button>
      </div>

      <section className="admin-category-summary" aria-label="Tổng quan danh mục">
        <article><span className="is-red"><AdminIcon name="folder" /></span><div><small>Tổng danh mục</small><strong>{categoryList.length}</strong></div></article>
        <article><span className="is-green"><AdminIcon name="eye" /></span><div><small>Đang hiển thị</small><strong>{activeCount}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="pause" /></span><div><small>Đang ẩn</small><strong>{hiddenCount}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="products" /></span><div><small>Sản phẩm đã phân loại</small><strong>{assignedProductCount}/{products.length}</strong></div></article>
      </section>

      <section className="admin-categories-panel">
        <div className="admin-categories-toolbar">
          <div>
            <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | CategoryStatus)}><option value="all">Tất cả trạng thái</option><option value="active">Đang hiển thị</option><option value="hidden">Đang ẩn</option></select></label>
            <label><span>Sắp xếp</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as CategorySort)}><option value="order">Thứ tự hiển thị</option><option value="name">Tên A - Z</option><option value="products">Nhiều sản phẩm nhất</option></select></label>
          </div>
          <span>Hiển thị <strong>{filteredCategories.length}</strong> / {categoryList.length} danh mục</span>
        </div>

        <div className="admin-categories-table-wrap">
          <table className="admin-categories-table">
            <thead><tr><th>Thứ tự</th><th>Danh mục</th><th>Đường dẫn</th><th>Sản phẩm</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
            <tbody>{filteredCategories.map((category) => {
              const productCount = getProductCount(category.slug)
              return <tr key={category.id}>
                <td><span className="admin-category-order">{category.displayOrder}</span></td>
                <td><div className="admin-category-cell"><div className="admin-category-thumb">{category.image ? <img src={category.image} alt="" /> : <AdminIcon name="folder" />}</div><div><strong>{category.name}</strong><span>{category.description || 'Chưa có mô tả cho danh mục này.'}</span></div></div></td>
                <td><code>/san-pham?danh-muc={category.slug}</code></td>
                <td><span className="admin-category-product-count"><strong>{productCount}</strong> sản phẩm</span></td>
                <td><button type="button" className={`admin-category-status is-${category.status}`} onClick={() => toggleStatus(category)}><i />{category.status === 'active' ? 'Đang hiển thị' : 'Đang ẩn'}</button></td>
                <td>{formatDate(category.createdAt)}</td>
                <td><div className="admin-category-actions"><button type="button" onClick={() => openEditForm(category)} title="Sửa danh mục" aria-label={`Sửa ${category.name}`}><AdminIcon name="edit" /></button><button type="button" className="is-danger" onClick={() => requestDelete(category)} title={productCount > 0 ? 'Danh mục đang có sản phẩm' : 'Xóa danh mục'} aria-label={`Xóa ${category.name}`}><AdminIcon name="trash" /></button></div></td>
              </tr>
            })}</tbody>
          </table>
          {filteredCategories.length === 0 ? <div className="admin-categories-empty"><AdminIcon name="search" /><strong>Không tìm thấy danh mục</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}
        </div>
      </section>

      {isFormOpen ? (
        <div className="admin-category-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsFormOpen(false)}>
          <section className="admin-category-modal" role="dialog" aria-modal="true" aria-labelledby="admin-category-form-title">
            <header><div><span>THÔNG TIN DANH MỤC</span><h2 id="admin-category-form-title">{editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h2></div><button type="button" onClick={() => setIsFormOpen(false)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <form onSubmit={handleSubmit}>
              <div className="admin-category-form-grid">
                <label><span>Tên danh mục *</span><input required maxLength={80} value={form.name} onChange={(event) => handleNameChange(event.target.value)} placeholder="Ví dụ: Serum" /></label>
                <label><span>Đường dẫn *</span><div className="admin-category-slug-field"><b>/</b><input required readOnly={editingCategoryProductCount > 0} value={form.slug} onChange={(event) => { setIsSlugManuallyEdited(true); updateField('slug', event.target.value) }} placeholder="serum" /></div>{editingCategoryProductCount > 0 ? <small>Không thể đổi vì đang có {editingCategoryProductCount} sản phẩm.</small> : null}</label>
                <label><span>Thứ tự hiển thị *</span><input required type="number" min="1" value={form.displayOrder} onChange={(event) => updateField('displayOrder', event.target.value)} /></label>
                <label><span>Trạng thái</span><select value={form.status} onChange={(event) => updateField('status', event.target.value as CategoryStatus)}><option value="active">Đang hiển thị</option><option value="hidden">Đang ẩn</option></select></label>
                <label className="is-wide"><span>Mô tả</span><textarea rows={4} maxLength={300} value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Mô tả ngắn về nhóm sản phẩm..." /><small>{form.description.length}/300 ký tự</small></label>
                <label className="is-wide"><span>Ảnh danh mục</span><div className="admin-category-image-field"><div className="admin-category-image-preview">{form.image ? <img src={form.image} alt="Ảnh xem trước" /> : <AdminIcon name="upload" />}</div><div><div className="admin-category-image-input"><input placeholder="/images/... hoặc đường dẫn ảnh" value={form.image} onChange={(event) => { updateField('image', event.target.value); setSelectedImageName('') }} /><button type="button" onClick={() => imageFileInputRef.current?.click()}><AdminIcon name="upload" />Chọn ảnh từ máy</button><input ref={imageFileInputRef} className="admin-category-hidden-file" type="file" accept="image/png,image/jpeg,image/webp" tabIndex={-1} onChange={handleImageFileChange} /></div><small>{selectedImageName ? `Đã chọn: ${selectedImageName}` : 'Ảnh JPG, PNG hoặc WEBP, tối đa 5MB.'}</small></div></div></label>
              </div>
              <footer><button type="button" className="admin-category-secondary" onClick={() => setIsFormOpen(false)}>Hủy</button><button type="submit" className="admin-category-primary">{editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}</button></footer>
            </form>
          </section>
        </div>
      ) : null}

      {deletingCategory ? (
        <div className="admin-category-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDeletingCategory(null)}>
          <section className="admin-category-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="admin-category-delete-title"><span><AdminIcon name="trash" /></span><h2 id="admin-category-delete-title">Xóa danh mục?</h2><p>Bạn sắp xóa danh mục <strong>{deletingCategory.name}</strong>. Thao tác này hiện chỉ áp dụng trên dữ liệu frontend.</p><div><button type="button" className="admin-category-secondary" onClick={() => setDeletingCategory(null)}>Hủy</button><button type="button" className="admin-category-danger" onClick={confirmDelete}>Xóa danh mục</button></div></section>
        </div>
      ) : null}

      {notice ? <div className={`admin-category-toast is-${notice.type}`} role="status"><span>{notice.type === 'success' ? '✓' : '!'}</span>{notice.message}</div> : null}
    </AdminLayout>
  )
}

export default AdminCategoriesPage
