import { useEffect, useMemo, useState } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import Pagination from '../../components/Pagination'
import { usePagination } from '../../hooks/usePagination'
import { api } from '../../services/api'
import './AdminArticleCommentsPage.css'

type CommentStatus = 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI'

type ArticleComment = {
  id: string
  articleId: string
  articleTitle: string
  name: string
  email: string
  content: string
  status: CommentStatus
  createdAt: string
}

const statusMeta: Record<CommentStatus, { label: string; tone: string }> = {
  CHO_DUYET: { label: 'Chờ duyệt', tone: 'pending' },
  DA_DUYET: { label: 'Đã hiển thị', tone: 'approved' },
  TU_CHOI: { label: 'Đã từ chối', tone: 'rejected' },
}

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value))

function AdminArticleCommentsPage() {
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CommentStatus>('all')
  const [articleFilter, setArticleFilter] = useState('all')
  const [deletingComment, setDeletingComment] = useState<ArticleComment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadComments = async () => {
    try {
      const data = await api.get<{ items: ArticleComment[] }>('/admin/article-comments?limit=100')
      setComments(data.items)
    } catch (error) {
      setComments([])
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Không thể tải bình luận bài viết' })
    }
  }

  useEffect(() => { void loadComments() }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  const articleOptions = useMemo(() => Array.from(
    new Map(comments.map((comment) => [comment.articleId, comment.articleTitle])).entries(),
  ), [comments])

  const filteredComments = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase('vi-VN')
    return comments.filter((comment) => {
      const matchesKeyword = !keyword || [comment.name, comment.email, comment.content, comment.articleTitle]
        .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
      return matchesKeyword
        && (statusFilter === 'all' || comment.status === statusFilter)
        && (articleFilter === 'all' || comment.articleId === articleFilter)
    })
  }, [articleFilter, comments, searchValue, statusFilter])

  const { currentPage, totalPages, pageItems, setCurrentPage } = usePagination(
    filteredComments,
    8,
    `${searchValue}|${statusFilter}|${articleFilter}`,
  )

  const updateStatus = async (comment: ArticleComment, status: CommentStatus) => {
    try {
      await api.patch(`/admin/article-comments/${comment.id}`, { status })
      setComments((current) => current.map((item) => item.id === comment.id ? { ...item, status } : item))
      setNotice({
        type: 'success',
        message: status === 'DA_DUYET' ? 'Đã duyệt và hiển thị bình luận' : 'Đã từ chối bình luận',
      })
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Không thể cập nhật bình luận' })
    }
  }

  const confirmDelete = async () => {
    if (!deletingComment || isDeleting) return
    setIsDeleting(true)
    try {
      await api.delete(`/admin/article-comments/${deletingComment.id}`)
      setComments((current) => current.filter((item) => item.id !== deletingComment.id))
      setNotice({ type: 'success', message: 'Đã xóa vĩnh viễn bình luận' })
      setDeletingComment(null)
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Không thể xóa bình luận' })
    } finally {
      setIsDeleting(false)
    }
  }

  const pendingCount = comments.filter((comment) => comment.status === 'CHO_DUYET').length
  const approvedCount = comments.filter((comment) => comment.status === 'DA_DUYET').length
  const rejectedCount = comments.filter((comment) => comment.status === 'TU_CHOI').length

  return (
    <AdminLayout activeItem="articleComments" searchValue={searchValue} onSearchChange={setSearchValue} searchPlaceholder="Tìm người gửi, bài viết hoặc nội dung bình luận...">
      <div className="admin-page-heading admin-article-comments-heading">
        <div><p>QUẢN LÝ NỘI DUNG</p><h1>Bình luận bài viết</h1><span>Kiểm duyệt ý kiến bạn đọc trước khi hiển thị công khai.</span></div>
      </div>

      <section className="admin-article-comment-summary" aria-label="Tổng quan bình luận">
        <article><span className="is-blue"><AdminIcon name="message" /></span><div><small>Tổng bình luận</small><strong>{comments.length}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="calendar" /></span><div><small>Chờ duyệt</small><strong>{pendingCount}</strong></div></article>
        <article><span className="is-green"><AdminIcon name="eye" /></span><div><small>Đang hiển thị</small><strong>{approvedCount}</strong></div></article>
        <article><span className="is-red"><AdminIcon name="pause" /></span><div><small>Đã từ chối</small><strong>{rejectedCount}</strong></div></article>
      </section>

      <section className="admin-article-comments-panel">
        <div className="admin-article-comments-toolbar">
          <div>
            <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Tất cả trạng thái</option><option value="CHO_DUYET">Chờ duyệt</option><option value="DA_DUYET">Đã hiển thị</option><option value="TU_CHOI">Đã từ chối</option></select></label>
            <label><span>Bài viết</span><select value={articleFilter} onChange={(event) => setArticleFilter(event.target.value)}><option value="all">Tất cả bài viết</option>{articleOptions.map(([id, title]) => <option value={id} key={id}>{title}</option>)}</select></label>
          </div>
          <span>Hiển thị <strong>{filteredComments.length}</strong> / {comments.length} bình luận</span>
        </div>

        <div className="admin-article-comments-table-wrap">
          <table className="admin-article-comments-table">
            <thead><tr><th>Người gửi</th><th>Bài viết</th><th>Nội dung</th><th>Ngày gửi</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>{pageItems.map((comment) => {
              const meta = statusMeta[comment.status]
              return <tr key={comment.id}>
                <td><div className="admin-article-comment-author"><span>{comment.name.charAt(0).toLocaleUpperCase('vi-VN')}</span><div><strong>{comment.name}</strong><small>{comment.email}</small></div></div></td>
                <td><strong className="admin-article-comment-title">{comment.articleTitle}</strong></td>
                <td><p className="admin-article-comment-content">{comment.content}</p></td>
                <td><time dateTime={comment.createdAt}>{formatDateTime(comment.createdAt)}</time></td>
                <td><span className={`admin-article-comment-status is-${meta.tone}`}><i />{meta.label}</span></td>
                <td><div className="admin-article-comment-actions">{comment.status !== 'DA_DUYET' ? <button type="button" className="is-approve" title="Duyệt bình luận" aria-label="Duyệt bình luận" onClick={() => updateStatus(comment, 'DA_DUYET')}><AdminIcon name="play" /></button> : null}{comment.status !== 'TU_CHOI' ? <button type="button" title="Từ chối bình luận" aria-label="Từ chối bình luận" onClick={() => updateStatus(comment, 'TU_CHOI')}><AdminIcon name="pause" /></button> : null}<button type="button" className="is-danger" title="Xóa bình luận" aria-label="Xóa bình luận" onClick={() => setDeletingComment(comment)}><AdminIcon name="trash" /></button></div></td>
              </tr>
            })}</tbody>
          </table>
          {!filteredComments.length ? <div className="admin-article-comments-empty"><AdminIcon name="message" /><strong>Chưa có bình luận phù hợp</strong><span>Hãy thử thay đổi từ khóa hoặc bộ lọc.</span></div> : null}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredComments.length} pageSize={8} itemLabel="bình luận" onPageChange={setCurrentPage} />
      </section>

      {deletingComment ? <div className="admin-article-comment-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !isDeleting && setDeletingComment(null)}><section className="admin-article-comment-delete" role="alertdialog" aria-modal="true" aria-labelledby="delete-comment-title"><span><AdminIcon name="trash" /></span><h2 id="delete-comment-title">Xóa bình luận?</h2><p>Bình luận của <strong>{deletingComment.name}</strong> sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu.</p><div><button type="button" disabled={isDeleting} onClick={() => setDeletingComment(null)}>Hủy</button><button type="button" className="is-danger" disabled={isDeleting} onClick={confirmDelete}>{isDeleting ? 'Đang xóa...' : 'Xóa bình luận'}</button></div></section></div> : null}
      {notice ? <div className={`admin-article-comment-toast is-${notice.type}`} role="status"><span>{notice.type === 'success' ? '✓' : '!'}</span>{notice.message}</div> : null}
    </AdminLayout>
  )
}

export default AdminArticleCommentsPage
