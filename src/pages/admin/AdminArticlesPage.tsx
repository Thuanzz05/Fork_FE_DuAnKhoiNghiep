import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import { newsArticles } from '../../data/news'
import './AdminArticlesPage.css'

type ArticleStatus = 'published' | 'draft' | 'scheduled'
type ArticleSort = 'updated' | 'newest' | 'views' | 'title'

interface ManagedArticle {
  id: number
  title: string
  category: string
  excerpt: string
  lead: string
  content: string
  image: string
  author: string
  status: ArticleStatus
  publishedAt: string
  updatedAt: string
  views: number
  featured: boolean
}

interface ArticleFormState {
  title: string
  category: string
  excerpt: string
  lead: string
  content: string
  image: string
  author: string
  status: ArticleStatus
  publishedAt: string
  featured: boolean
}

const articleCategories = ['Kiến thức làm đẹp', 'Chăm sóc da', 'Hướng dẫn sử dụng', 'Câu chuyện thương hiệu']

const statusMeta: Record<ArticleStatus, { label: string; tone: string }> = {
  published: { label: 'Đã đăng', tone: 'published' },
  draft: { label: 'Bản nháp', tone: 'draft' },
  scheduled: { label: 'Đã lên lịch', tone: 'scheduled' },
}

const viewsByArticleId: Record<number, number> = {
  1: 1842,
  2: 1276,
  3: 968,
  4: 754,
  5: 683,
  6: 521,
}

const toIsoDate = (value: string) => {
  const [day, month, year] = value.split('/')
  return `${year}-${month}-${day}T08:00`
}

const bodyToText = (article: (typeof newsArticles)[number]) => article.body
  .flatMap((section) => [section.heading ? `## ${section.heading}` : '', ...section.paragraphs])
  .filter(Boolean)
  .join('\n\n')

const articleSeed: ManagedArticle[] = [
  ...newsArticles.map((article, index) => ({
    id: article.id,
    title: article.title,
    category: articleCategories[index % 3],
    excerpt: article.excerpt,
    lead: article.lead,
    content: bodyToText(article),
    image: article.image,
    author: 'Red Bean Beauty',
    status: 'published' as ArticleStatus,
    publishedAt: toIsoDate(article.date),
    updatedAt: toIsoDate(article.date),
    views: viewsByArticleId[article.id] ?? 0,
    featured: article.id === 1,
  })),
  {
    id: 7,
    title: 'Nhật ký phát triển mỹ phẩm từ hạt đậu đỏ Việt Nam',
    category: 'Câu chuyện thương hiệu',
    excerpt: 'Hành trình nghiên cứu nguyên liệu bản địa và phát triển bộ sản phẩm chăm sóc da dịu nhẹ của Rubeanora.',
    lead: 'Mỗi sản phẩm bắt đầu từ mong muốn nâng tầm nguyên liệu Việt và tạo ra trải nghiệm chăm sóc da gần gũi hơn.',
    content: '## Bắt đầu từ nguyên liệu Việt\n\nĐậu đỏ được lựa chọn nhờ nguồn dưỡng chất tự nhiên và sự gần gũi với người tiêu dùng Việt Nam.\n\n## Quá trình hoàn thiện sản phẩm\n\nCông thức được thử nghiệm, điều chỉnh để phù hợp với thói quen chăm sóc da hằng ngày.',
    image: '/images/chung_toi.png',
    author: 'Ban biên tập',
    status: 'draft',
    publishedAt: '2026-07-18T08:00',
    updatedAt: '2026-07-14T16:20',
    views: 0,
    featured: false,
  },
  {
    id: 8,
    title: '5 lưu ý khi bắt đầu chu trình chăm sóc da đậu đỏ',
    category: 'Hướng dẫn sử dụng',
    excerpt: 'Những lưu ý đơn giản giúp bạn sử dụng sản phẩm đúng tần suất và hạn chế kích ứng không mong muốn.',
    lead: 'Một chu trình hiệu quả nên bắt đầu chậm rãi, theo dõi phản ứng của da và duy trì đều đặn.',
    content: '## Thử sản phẩm trên vùng da nhỏ\n\nLuôn kiểm tra phản ứng của da trước khi dùng sản phẩm trên toàn khuôn mặt.\n\n## Duy trì tần suất phù hợp\n\nKhông nên tẩy tế bào chết quá thường xuyên, đặc biệt khi da đang nhạy cảm.',
    image: '/images/products/combo-duong-da-mini3.jpg',
    author: 'Red Bean Beauty',
    status: 'scheduled',
    publishedAt: '2026-07-20T09:00',
    updatedAt: '2026-07-15T08:10',
    views: 0,
    featured: false,
  },
]

const emptyForm: ArticleFormState = {
  title: '',
  category: articleCategories[0],
  excerpt: '',
  lead: '',
  content: '',
  image: '',
  author: 'Red Bean Beauty',
  status: 'draft',
  publishedAt: '2026-07-15T09:00',
  featured: false,
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(value))

function AdminArticlesPage() {
  const [articles, setArticles] = useState<ManagedArticle[]>(articleSeed)
  const [searchValue, setSearchValue] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all')
  const [sortBy, setSortBy] = useState<ArticleSort>('updated')
  const [editingArticle, setEditingArticle] = useState<ManagedArticle | null>(null)
  const [deletingArticle, setDeletingArticle] = useState<ManagedArticle | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<ArticleFormState>(emptyForm)
  const [selectedImageName, setSelectedImageName] = useState('')
  const [notice, setNotice] = useState('')
  const imageFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!isFormOpen && !deletingArticle) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFormOpen(false)
        setDeletingArticle(null)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [deletingArticle, isFormOpen])

  const filteredArticles = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase('vi-VN')
    return articles
      .filter((article) => {
        const matchesSearch = !keyword || [article.title, article.excerpt, article.author, article.category]
          .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
        const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter
        const matchesStatus = statusFilter === 'all' || article.status === statusFilter
        return matchesSearch && matchesCategory && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        if (sortBy === 'views') return b.views - a.views
        if (sortBy === 'title') return a.title.localeCompare(b.title, 'vi')
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  }, [articles, categoryFilter, searchValue, sortBy, statusFilter])

  const publishedCount = articles.filter((article) => article.status === 'published').length
  const draftCount = articles.filter((article) => article.status === 'draft').length
  const scheduledCount = articles.filter((article) => article.status === 'scheduled').length
  const totalViews = articles.reduce((total, article) => total + article.views, 0)

  const updateField = <K extends keyof ArticleFormState>(field: K, value: ArticleFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const openCreateForm = () => {
    setEditingArticle(null)
    setSelectedImageName('')
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEditForm = (article: ManagedArticle) => {
    setEditingArticle(article)
    setSelectedImageName('')
    setForm({
      title: article.title,
      category: article.category,
      excerpt: article.excerpt,
      lead: article.lead,
      content: article.content,
      image: article.image,
      author: article.author,
      status: article.status,
      publishedAt: article.publishedAt.slice(0, 16),
      featured: article.featured,
    })
    setIsFormOpen(true)
  }

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotice('Vui lòng chọn đúng định dạng ảnh')
      event.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice('Ảnh bài viết không được vượt quá 5MB')
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
    const now = new Date().toISOString()
    if (editingArticle) {
      setArticles((current) => current.map((article) => article.id === editingArticle.id ? {
        ...article,
        ...form,
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        lead: form.lead.trim(),
        content: form.content.trim(),
        image: form.image.trim(),
        author: form.author.trim(),
        updatedAt: now,
      } : article))
      setNotice(`Đã cập nhật bài viết “${form.title.trim()}”`)
    } else {
      const newArticle: ManagedArticle = {
        id: Math.max(0, ...articles.map((article) => article.id)) + 1,
        ...form,
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        lead: form.lead.trim(),
        content: form.content.trim(),
        image: form.image.trim(),
        author: form.author.trim(),
        updatedAt: now,
        views: 0,
      }
      setArticles((current) => [newArticle, ...current])
      setNotice(`Đã tạo bài viết “${newArticle.title}”`)
    }
    setIsFormOpen(false)
  }

  const confirmDelete = () => {
    if (!deletingArticle) return
    setArticles((current) => current.filter((article) => article.id !== deletingArticle.id))
    setNotice(`Đã xóa bài viết “${deletingArticle.title}”`)
    setDeletingArticle(null)
  }

  return (
    <AdminLayout activeItem="articles" searchValue={searchValue} onSearchChange={setSearchValue} searchPlaceholder="Tìm tiêu đề, tác giả hoặc nội dung bài viết...">
      <div className="admin-page-heading admin-articles-heading">
        <div><p>QUẢN LÝ NỘI DUNG</p><h1>Quản lý bài viết</h1><span>Biên tập và theo dõi nội dung hiển thị trên trang Tin tức.</span></div>
        <button type="button" className="admin-article-primary" onClick={openCreateForm}><AdminIcon name="plus" />Thêm bài viết</button>
      </div>

      <section className="admin-article-summary" aria-label="Tổng quan bài viết">
        <article><span className="is-red"><AdminIcon name="news" /></span><div><small>Tổng bài viết</small><strong>{articles.length}</strong></div></article>
        <article><span className="is-green"><AdminIcon name="play" /></span><div><small>Đã đăng</small><strong>{publishedCount}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="edit" /></span><div><small>Nháp / Lên lịch</small><strong>{draftCount + scheduledCount}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="eye" /></span><div><small>Tổng lượt xem</small><strong>{totalViews.toLocaleString('vi-VN')}</strong></div></article>
      </section>

      <section className="admin-articles-panel">
        <div className="admin-articles-toolbar">
          <div>
            <label><span>Danh mục</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Lọc bài viết theo danh mục"><option value="all">Tất cả danh mục</option>{articleCategories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
            <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ArticleStatus)} aria-label="Lọc trạng thái bài viết"><option value="all">Tất cả trạng thái</option><option value="published">Đã đăng</option><option value="draft">Bản nháp</option><option value="scheduled">Đã lên lịch</option></select></label>
            <label><span>Sắp xếp</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as ArticleSort)} aria-label="Sắp xếp bài viết"><option value="updated">Mới cập nhật</option><option value="newest">Ngày đăng mới nhất</option><option value="views">Lượt xem cao nhất</option><option value="title">Tên bài viết</option></select></label>
          </div>
          <span>Hiển thị <strong>{filteredArticles.length}</strong> / {articles.length} bài</span>
        </div>

        <div className="admin-articles-table-wrap">
          <table className="admin-articles-table">
            <thead><tr><th>Bài viết</th><th>Danh mục</th><th>Trạng thái</th><th>Ngày đăng</th><th>Lượt xem</th><th>Nổi bật</th><th>Thao tác</th></tr></thead>
            <tbody>{filteredArticles.map((article) => {
              const status = statusMeta[article.status]
              return <tr key={article.id}>
                <td><div className="admin-article-cell"><img src={article.image} alt="" /><div><strong>{article.title}</strong><span>{article.excerpt}</span><small>Bởi {article.author} · Cập nhật {formatDateTime(article.updatedAt)}</small></div></div></td>
                <td><span className="admin-article-category">{article.category}</span></td>
                <td><span className={`admin-article-status is-${status.tone}`}><i />{status.label}</span></td>
                <td><div className="admin-article-date"><strong>{formatDateTime(article.publishedAt)}</strong>{article.status === 'scheduled' ? <span>Đang chờ đăng</span> : null}</div></td>
                <td><strong className="admin-article-views">{article.views.toLocaleString('vi-VN')}</strong></td>
                <td><span className={`admin-article-featured${article.featured ? ' is-featured' : ''}`}>{article.featured ? 'Nổi bật' : 'Thông thường'}</span></td>
                <td><div className="admin-article-actions"><button type="button" onClick={() => openEditForm(article)} aria-label={`Sửa bài ${article.title}`} title="Sửa bài viết"><AdminIcon name="edit" /></button><button type="button" className="is-danger" onClick={() => setDeletingArticle(article)} aria-label={`Xóa bài ${article.title}`} title="Xóa bài viết"><AdminIcon name="trash" /></button></div></td>
              </tr>
            })}</tbody>
          </table>
          {filteredArticles.length === 0 ? <div className="admin-articles-empty"><AdminIcon name="search" /><strong>Không tìm thấy bài viết</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}
        </div>
      </section>

      {isFormOpen ? (
        <div className="admin-article-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsFormOpen(false)}>
          <section className="admin-article-modal" role="dialog" aria-modal="true" aria-labelledby="admin-article-form-title">
            <header><div><span>BIÊN TẬP NỘI DUNG</span><h2 id="admin-article-form-title">{editingArticle ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h2></div><button type="button" onClick={() => setIsFormOpen(false)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <form onSubmit={handleSubmit}>
              <div className="admin-article-form-grid">
                <label className="is-wide"><span>Tiêu đề bài viết *</span><input required maxLength={180} value={form.title} onChange={(event) => updateField('title', event.target.value)} /></label>
                <label><span>Danh mục *</span><select required value={form.category} onChange={(event) => updateField('category', event.target.value)}>{articleCategories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
                <label><span>Tác giả *</span><input required value={form.author} onChange={(event) => updateField('author', event.target.value)} /></label>
                <label><span>Trạng thái *</span><select value={form.status} onChange={(event) => updateField('status', event.target.value as ArticleStatus)}><option value="published">Đã đăng</option><option value="draft">Bản nháp</option><option value="scheduled">Đã lên lịch</option></select></label>
                <label><span>Ngày đăng *</span><input required type="datetime-local" value={form.publishedAt} onChange={(event) => updateField('publishedAt', event.target.value)} /></label>
                <label className="is-wide"><span>Ảnh đại diện *</span><div className="admin-article-image-field"><div className="admin-article-image-preview">{form.image ? <img src={form.image} alt="Ảnh xem trước" /> : <AdminIcon name="upload" />}</div><div><div className="admin-article-image-input"><input required placeholder="/images/... hoặc đường dẫn ảnh" value={form.image} onChange={(event) => { updateField('image', event.target.value); setSelectedImageName('') }} /><button type="button" onClick={() => imageFileInputRef.current?.click()}><AdminIcon name="upload" />Chọn ảnh từ máy</button><input ref={imageFileInputRef} className="admin-article-hidden-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" tabIndex={-1} onChange={handleImageFileChange} /></div><small>{selectedImageName ? `Đã chọn: ${selectedImageName}` : 'Ảnh ngang, dung lượng tối đa 5MB.'}</small></div></div></label>
                <label className="is-wide"><span>Mô tả ngắn *</span><textarea required rows={3} maxLength={320} value={form.excerpt} onChange={(event) => updateField('excerpt', event.target.value)} /><small>{form.excerpt.length}/320 ký tự</small></label>
                <label className="is-wide"><span>Đoạn mở đầu *</span><textarea required rows={3} value={form.lead} onChange={(event) => updateField('lead', event.target.value)} /></label>
                <label className="is-wide"><span>Nội dung bài viết *</span><textarea required rows={9} placeholder="Dùng ## ở đầu dòng để tạo tiêu đề nội dung" value={form.content} onChange={(event) => updateField('content', event.target.value)} /><small>Có thể chia nội dung thành nhiều đoạn; dùng “## Tiêu đề” để đánh dấu đề mục.</small></label>
                <label className="admin-article-checkbox is-wide"><input type="checkbox" checked={form.featured} onChange={(event) => updateField('featured', event.target.checked)} /><span>Đánh dấu là bài viết nổi bật</span></label>
              </div>
              <footer><button type="button" className="admin-article-secondary" onClick={() => setIsFormOpen(false)}>Hủy</button><button type="submit" className="admin-article-primary">{editingArticle ? 'Lưu thay đổi' : 'Tạo bài viết'}</button></footer>
            </form>
          </section>
        </div>
      ) : null}

      {deletingArticle ? (
        <div className="admin-article-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDeletingArticle(null)}>
          <section className="admin-article-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="admin-article-delete-title"><span><AdminIcon name="trash" /></span><h2 id="admin-article-delete-title">Xóa bài viết?</h2><p>Bạn sắp xóa <strong>{deletingArticle.title}</strong>. Thao tác này hiện chỉ áp dụng trên dữ liệu frontend.</p><div><button type="button" className="admin-article-secondary" onClick={() => setDeletingArticle(null)}>Hủy</button><button type="button" className="admin-article-danger" onClick={confirmDelete}>Xóa bài viết</button></div></section>
        </div>
      ) : null}

      {notice ? <div className="admin-article-toast" role="status"><span>✓</span>{notice}</div> : null}
    </AdminLayout>
  )
}

export default AdminArticlesPage
