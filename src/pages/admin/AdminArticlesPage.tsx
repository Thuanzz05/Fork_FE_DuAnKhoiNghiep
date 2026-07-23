import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import Pagination from '../../components/Pagination'
import { usePagination } from '../../hooks/usePagination'
import { api, apiRequest, resolveApiUrl } from '../../services/api'
import './AdminArticlesPage.css'

type ArticleStatus = 'published' | 'draft'
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
}

const initialArticles: ManagedArticle[] = []

const emptyForm: ArticleFormState = {
  title: '',
  category: articleCategories[0],
  excerpt: '',
  lead: '',
  content: '',
  image: '',
  author: 'Red Bean Beauty',
  status: 'draft',
  publishedAt: new Date().toISOString().slice(0, 16),
  featured: false,
}

type StoredArticleSection = {
  heading?: unknown
  paragraphs?: unknown
}

type ParsedArticleContent = {
  lead: string
  content: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const normalizeArticleImagePath = (value: unknown) => {
  const path = String(value ?? '').trim().replaceAll('\\', '/')
  return path.replace(/^\/?public\//i, '/')
}

const parseStoredArticleContent = (value: unknown, depth = 0): ParsedArticleContent => {
  const rawContent = String(value ?? '').trim()
  if (!rawContent) return { lead: '', content: '' }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    return { lead: '', content: rawContent }
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.sections)) {
    return { lead: '', content: rawContent }
  }

  const lead = typeof parsed.lead === 'string' ? parsed.lead.trim() : ''
  const sections = parsed.sections.filter(isRecord) as StoredArticleSection[]

  // Recover content saved by the old form, which wrapped the original JSON
  // inside a single paragraph every time an article was edited.
  if (depth < 4 && sections.length === 1) {
    const onlySection = sections[0]
    const paragraphs = Array.isArray(onlySection.paragraphs) ? onlySection.paragraphs : []
    if (!onlySection.heading && paragraphs.length === 1 && typeof paragraphs[0] === 'string') {
      const nested = parseStoredArticleContent(paragraphs[0], depth + 1)
      if (nested.content !== paragraphs[0].trim()) {
        return { lead: lead || nested.lead, content: nested.content }
      }
    }
  }

  const content = sections
    .flatMap((section) => {
      const heading = typeof section.heading === 'string' ? section.heading.trim() : ''
      const paragraphs = Array.isArray(section.paragraphs)
        ? section.paragraphs.filter((paragraph): paragraph is string => typeof paragraph === 'string')
          .map((paragraph) => paragraph.trim()).filter(Boolean)
        : []
      return [...(heading ? [`## ${heading}`] : []), ...paragraphs]
    })
    .join('\n\n')

  return { lead, content }
}

const buildArticleSections = (value: string) => {
  const sections: Array<{ heading?: string; paragraphs: string[] }> = []
  let current: { heading?: string; paragraphs: string[] } = { paragraphs: [] }
  let paragraphLines: string[] = []

  const flushParagraph = () => {
    const paragraph = paragraphLines.join('\n').trim()
    if (paragraph) current.paragraphs.push(paragraph)
    paragraphLines = []
  }

  const flushSection = () => {
    flushParagraph()
    if (current.heading || current.paragraphs.length) sections.push(current)
  }

  value.replaceAll('\r', '').split('\n').forEach((line) => {
    const heading = line.match(/^##\s+(.+)$/)
    if (heading) {
      flushSection()
      current = { heading: heading[1].trim(), paragraphs: [] }
      return
    }
    if (!line.trim()) {
      flushParagraph()
      return
    }
    paragraphLines.push(line)
  })
  flushSection()

  return sections
}

const toDateTimeLocalValue = (value: unknown) => {
  const date = new Date(String(value ?? ''))
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 16)
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 16)
}

const toDatabaseDateTime = (value: string) => {
  if (!value) return undefined
  return `${value.replace('T', ' ')}${value.length === 16 ? ':00' : ''}`
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(value))

function AdminArticlesPage() {
  const [articles, setArticles] = useState<ManagedArticle[]>(initialArticles)

  const loadArticles = async () => {
    try {
      const rows = await api.get<Array<Record<string, any>>>('/admin/articles')
      setArticles(rows.map((item) => {
        const parsedContent = parseStoredArticleContent(item.content)
        return {
          id: Number(item.id), title: String(item.title), category: String(item.category || articleCategories[0]),
          excerpt: String(item.summary || ''), lead: parsedContent.lead, content: parsedContent.content,
          image: normalizeArticleImagePath(item.imageUrl), author: String(item.authorName || 'Rubeanora'),
          status: item.status === 'DA_DANG' ? 'published' : 'draft',
          publishedAt: String(item.publishedAt || item.createdAt), updatedAt: String(item.updatedAt),
          views: Number(item.views || 0), featured: Boolean(item.featured),
        }
      }))
    } catch {
      setArticles([])
    }
  }

  useEffect(() => { void loadArticles() }, [])
  const [searchValue, setSearchValue] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all')
  const [sortBy, setSortBy] = useState<ArticleSort>('updated')
  const [editingArticle, setEditingArticle] = useState<ManagedArticle | null>(null)
  const [deletingArticle, setDeletingArticle] = useState<ManagedArticle | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<ArticleFormState>(emptyForm)
  const [selectedImageName, setSelectedImageName] = useState('')
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

  const { currentPage, totalPages, pageItems: paginatedArticles, setCurrentPage } = usePagination(
    filteredArticles,
    5,
    `${searchValue}|${categoryFilter}|${statusFilter}|${sortBy}`,
  )

  const publishedCount = articles.filter((article) => article.status === 'published').length
  const draftCount = articles.filter((article) => article.status === 'draft').length
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
      publishedAt: toDateTimeLocalValue(article.publishedAt),
      featured: article.featured,
    })
    setIsFormOpen(true)
  }

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
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

    setIsImageUploading(true)
    setNotice('')
    try {
      const uploaded = await apiRequest<{ url: string }>('/admin/uploads/images', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-File-Name': encodeURIComponent(file.name),
        },
        body: file,
      })
      updateField('image', resolveApiUrl(uploaded.url))
      setSelectedImageName(file.name)
      setNotice('Đã tải ảnh lên thành công')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể tải ảnh lên')
    } finally {
      setIsImageUploading(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isImageUploading) {
      setNotice('Vui lòng chờ ảnh tải lên hoàn tất')
      return
    }
    try {
      const payload = {
        title: form.title.trim(), category: form.category, summary: form.excerpt.trim(),
        content: JSON.stringify({
          lead: form.lead.trim(),
          sections: buildArticleSections(form.content),
        }),
        imageUrl: normalizeArticleImagePath(form.image), featured: form.featured,
        status: form.status === 'published' ? 'DA_DANG' : 'NHAP',
        publishedAt: toDatabaseDateTime(form.publishedAt),
      }
      if (editingArticle) await api.put(`/admin/articles/${editingArticle.id}`, payload)
      else await api.post('/admin/articles', payload)
      await loadArticles()
      setNotice(editingArticle ? `Đã cập nhật bài viết “${form.title.trim()}”` : `Đã tạo bài viết “${form.title.trim()}”`)
      setIsFormOpen(false)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể lưu bài viết')
    }
  }

  const confirmDelete = async () => {
    if (!deletingArticle || isDeleting) return
    setIsDeleting(true)
    try {
      await api.delete(`/admin/articles/${deletingArticle.id}`)
      await loadArticles()
      setNotice(`Đã xóa bài viết “${deletingArticle.title}”`)
      setDeletingArticle(null)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể xóa bài viết')
    } finally {
      setIsDeleting(false)
    }
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
        <article><span className="is-orange"><AdminIcon name="edit" /></span><div><small>Bản nháp</small><strong>{draftCount}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="eye" /></span><div><small>Tổng lượt xem</small><strong>{totalViews.toLocaleString('vi-VN')}</strong></div></article>
      </section>

      <section className="admin-articles-panel">
        <div className="admin-articles-toolbar">
          <div>
            <label><span>Danh mục</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Lọc bài viết theo danh mục"><option value="all">Tất cả danh mục</option>{articleCategories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
            <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ArticleStatus)} aria-label="Lọc trạng thái bài viết"><option value="all">Tất cả trạng thái</option><option value="published">Đã đăng</option><option value="draft">Bản nháp</option></select></label>
            <label><span>Sắp xếp</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as ArticleSort)} aria-label="Sắp xếp bài viết"><option value="updated">Mới cập nhật</option><option value="newest">Ngày đăng mới nhất</option><option value="views">Lượt xem cao nhất</option><option value="title">Tên bài viết</option></select></label>
          </div>
          <span>Hiển thị <strong>{filteredArticles.length}</strong> / {articles.length} bài</span>
        </div>

        <div className="admin-articles-table-wrap">
          <table className="admin-articles-table">
            <thead><tr><th>Bài viết</th><th>Danh mục</th><th>Trạng thái</th><th>Ngày đăng</th><th>Lượt xem</th><th>Nổi bật</th><th>Thao tác</th></tr></thead>
            <tbody>{paginatedArticles.map((article) => {
              const status = statusMeta[article.status]
              return <tr key={article.id}>
                <td><div className="admin-article-cell"><img src={article.image} alt="" /><div><strong>{article.title}</strong><span>{article.excerpt}</span><small>Bởi {article.author} · Cập nhật {formatDateTime(article.updatedAt)}</small></div></div></td>
                <td><span className="admin-article-category">{article.category}</span></td>
                <td><span className={`admin-article-status is-${status.tone}`}><i />{status.label}</span></td>
                <td><div className="admin-article-date"><strong>{formatDateTime(article.publishedAt)}</strong></div></td>
                <td><strong className="admin-article-views">{article.views.toLocaleString('vi-VN')}</strong></td>
                <td><span className={`admin-article-featured${article.featured ? ' is-featured' : ''}`}>{article.featured ? 'Nổi bật' : 'Thông thường'}</span></td>
                <td><div className="admin-article-actions"><button type="button" onClick={() => openEditForm(article)} aria-label={`Sửa bài ${article.title}`} title="Sửa bài viết"><AdminIcon name="edit" /></button><button type="button" className="is-danger" onClick={() => setDeletingArticle(article)} aria-label={`Xóa bài ${article.title}`} title="Xóa bài viết"><AdminIcon name="trash" /></button></div></td>
              </tr>
            })}</tbody>
          </table>
          {filteredArticles.length === 0 ? <div className="admin-articles-empty"><AdminIcon name="search" /><strong>Không tìm thấy bài viết</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredArticles.length} pageSize={5} itemLabel="bài viết" onPageChange={setCurrentPage} />
      </section>

      {isFormOpen ? (
        <div className="admin-article-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsFormOpen(false)}>
          <section className="admin-article-modal" role="dialog" aria-modal="true" aria-labelledby="admin-article-form-title">
            <header><div><span>BIÊN TẬP NỘI DUNG</span><h2 id="admin-article-form-title">{editingArticle ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h2></div><button type="button" onClick={() => setIsFormOpen(false)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <form onSubmit={handleSubmit}>
              <div className="admin-article-form-grid">
                <label className="is-wide"><span>Tiêu đề bài viết *</span><input required maxLength={180} value={form.title} onChange={(event) => updateField('title', event.target.value)} /></label>
                <label><span>Danh mục *</span><select required value={form.category} onChange={(event) => updateField('category', event.target.value)}>{articleCategories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
                <label><span>Tác giả</span><input value={form.author} readOnly /></label>
                <label><span>Trạng thái *</span><select value={form.status} onChange={(event) => updateField('status', event.target.value as ArticleStatus)}><option value="published">Đã đăng</option><option value="draft">Bản nháp</option></select></label>
                <label><span>Ngày đăng *</span><input required type="datetime-local" value={form.publishedAt} onChange={(event) => updateField('publishedAt', event.target.value)} /></label>
                <label className="is-wide"><span>Ảnh đại diện *</span><div className="admin-article-image-field"><div className="admin-article-image-preview">{form.image ? <img src={form.image} alt="Ảnh xem trước" /> : <AdminIcon name="upload" />}</div><div><div className="admin-article-image-input"><input required placeholder="/images/... hoặc đường dẫn ảnh" value={form.image} onChange={(event) => { updateField('image', event.target.value); setSelectedImageName('') }} /><button type="button" disabled={isImageUploading} onClick={() => imageFileInputRef.current?.click()}><AdminIcon name="upload" />{isImageUploading ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}</button><input ref={imageFileInputRef} className="admin-article-hidden-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" tabIndex={-1} onChange={handleImageFileChange} /></div><small>{isImageUploading ? 'Đang tải ảnh lên máy chủ...' : selectedImageName ? `Đã tải lên: ${selectedImageName}` : 'Ảnh ngang, dung lượng tối đa 5MB.'}</small></div></div></label>
                <label className="is-wide"><span>Mô tả ngắn *</span><textarea required rows={3} maxLength={320} value={form.excerpt} onChange={(event) => updateField('excerpt', event.target.value)} /><small>{form.excerpt.length}/320 ký tự</small></label>
                <label className="is-wide"><span>Đoạn mở đầu *</span><textarea required rows={3} value={form.lead} onChange={(event) => updateField('lead', event.target.value)} /></label>
                <label className="is-wide"><span>Nội dung bài viết *</span><textarea required rows={9} placeholder="Dùng ## ở đầu dòng để tạo tiêu đề nội dung" value={form.content} onChange={(event) => updateField('content', event.target.value)} /><small>Có thể chia nội dung thành nhiều đoạn; dùng “## Tiêu đề” để đánh dấu đề mục.</small></label>
                <label className="admin-article-checkbox is-wide"><input type="checkbox" checked={form.featured} onChange={(event) => updateField('featured', event.target.checked)} /><span>Đánh dấu là bài viết nổi bật</span></label>
              </div>
              <footer><button type="button" className="admin-article-secondary" onClick={() => setIsFormOpen(false)}>Hủy</button><button type="submit" className="admin-article-primary" disabled={isImageUploading}>{isImageUploading ? 'Đang tải ảnh...' : editingArticle ? 'Lưu thay đổi' : 'Tạo bài viết'}</button></footer>
            </form>
          </section>
        </div>
      ) : null}

      {deletingArticle ? (
        <div className="admin-article-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDeletingArticle(null)}>
          <section className="admin-article-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="admin-article-delete-title"><span><AdminIcon name="trash" /></span><h2 id="admin-article-delete-title">Xóa bài viết?</h2><p>Bạn sắp xóa vĩnh viễn <strong>{deletingArticle.title}</strong>. Các bình luận thuộc bài viết cũng sẽ bị xóa và thao tác này không thể hoàn tác.</p><div><button type="button" className="admin-article-secondary" disabled={isDeleting} onClick={() => setDeletingArticle(null)}>Hủy</button><button type="button" className="admin-article-danger" disabled={isDeleting} onClick={confirmDelete}>{isDeleting ? 'Đang xóa...' : 'Xóa bài viết'}</button></div></section>
        </div>
      ) : null}

      {notice ? <div className="admin-article-toast" role="status"><span>✓</span>{notice}</div> : null}
    </AdminLayout>
  )
}

export default AdminArticlesPage
