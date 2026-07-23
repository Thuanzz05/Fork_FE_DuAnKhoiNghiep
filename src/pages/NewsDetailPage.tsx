import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { normalizeNewsArticle, type NewsArticle } from '../data/news'
import { api } from '../services/api'
import './NewsDetailPage.css'

type ArticleComment = {
  id: string
  name: string
  content: string
  createdAt: string
}

const formatCommentDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value))

const getCommentInitial = (name: string) => name.trim().charAt(0).toLocaleUpperCase('vi-VN') || 'K'

function NewsDetailPage() {
  const { id } = useParams()
  const [article, setArticle] = useState<NewsArticle | undefined>(undefined)
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([])
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentState, setCommentState] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setCommentState(null)
    api.get<{ article: NewsArticle; relatedArticles: NewsArticle[]; comments: ArticleComment[] }>(`/news/${id}`)
      .then((data) => {
        setArticle(normalizeNewsArticle(data.article))
        setRelatedArticles(data.relatedArticles.map(normalizeNewsArticle))
        setComments(data.comments ?? [])
      })
      .catch(() => {
        setArticle(undefined)
        setRelatedArticles([])
        setComments([])
      })
      .finally(() => setLoading(false))
  }, [id])

  if (!article && loading) return null
  if (!article) return <Navigate to="/404" replace />

  const handleComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isCommentSubmitting) return
    const form = event.currentTarget
    const formData = new FormData(form)
    setIsCommentSubmitting(true)
    setCommentState(null)
    try {
      await api.post(`/news/${article.id}/comments`, {
        name: String(formData.get('name') || ''), email: String(formData.get('email') || ''),
        content: String(formData.get('content') || ''),
      })
      form.reset()
      setCommentState({ type: 'success', message: 'Cảm ơn bạn. Bình luận đã được ghi nhận và đang chờ quản trị viên duyệt.' })
    } catch (error) {
      setCommentState({ type: 'error', message: error instanceof Error ? error.message : 'Không thể gửi bình luận. Vui lòng thử lại.' })
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  return (
    <main className="news-detail-page">
      <nav className="news-breadcrumb" aria-label="Đường dẫn">
        <div className="news-detail-container">
          <Link to="/">Trang chủ</Link><span>/</span>
          <Link to="/tin-tuc">Tin tức</Link><span>/</span>
          <strong>{article.title}</strong>
        </div>
      </nav>

      <div className="news-detail-container news-detail-layout">
        <aside className="news-sidebar">
          <section className="sidebar-box">
            <h2>Danh mục</h2>
            <nav aria-label="Danh mục trang">
              <Link to="/">Trang chủ</Link>
              <Link to="/gioi-thieu">Giới thiệu</Link>
              <Link to="/san-pham">Sản phẩm <span>+</span></Link>
              <Link className="current" to="/tin-tuc">Tin tức</Link>
              <Link to="/lien-he">Liên hệ</Link>
            </nav>
          </section>

          <section className="sidebar-box related-box">
            <h2>Bài viết liên quan</h2>
            <div className="related-list">
              {relatedArticles.map((item) => (
                <Link to={`/tin-tuc/${item.id}`} key={item.id}>
                  <img src={item.image} alt="" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </section>
        </aside>

        <article className="news-detail-article">
          <h1>{article.title}</h1>
          <div className="news-detail-meta">
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>
              {article.author || 'Rubeanora'}
            </span>
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
              {article.date}
            </span>
          </div>

          <p className="article-lead">{article.lead}</p>
          <img className="article-main-image" src={article.image} alt={article.title} />

          <div className="article-content">
            {article.body.map((section, index) => (
              <section key={`${article.id}-${index}`}>
                {section.heading && <h2>{section.heading}</h2>}
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
            <p>
              Chăm sóc da cần sự kiên trì và lựa chọn phù hợp với cơ địa mỗi người. Thông tin trong bài viết mang tính tham khảo;
              nếu da có dấu hiệu kích ứng kéo dài, bạn nên tham khảo ý kiến bác sĩ da liễu.
            </p>
          </div>

          <section className="news-comments-list" aria-labelledby="news-comments-title">
            <div className="news-comments-heading">
              <div><span>Ý KIẾN BẠN ĐỌC</span><h2 id="news-comments-title">Bình luận ({comments.length})</h2></div>
            </div>
            {comments.length ? (
              <div className="news-comments-items">
                {comments.map((comment) => (
                  <article className="news-comment-item" key={comment.id}>
                    <span className="news-comment-avatar" aria-hidden="true">{getCommentInitial(comment.name)}</span>
                    <div>
                      <header><strong>{comment.name}</strong><time dateTime={comment.createdAt}>{formatCommentDate(comment.createdAt)}</time></header>
                      <p>{comment.content}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className="news-comments-empty">Chưa có bình luận được duyệt. Hãy là người đầu tiên chia sẻ ý kiến về bài viết.</p>}
          </section>

          <section className="news-comment-section">
            <h2>Viết bình luận của bạn</h2>
            <p>Địa chỉ email của bạn sẽ được bảo mật. Các trường bắt buộc được đánh dấu *</p>
            <form onSubmit={handleComment}>
              <div className="comment-row">
                <input type="text" name="name" placeholder="Họ tên *" aria-label="Họ tên" maxLength={150} required />
                <input type="email" name="email" placeholder="Email *" aria-label="Email" maxLength={150} required />
              </div>
              <textarea name="content" placeholder="Nội dung *" aria-label="Nội dung" rows={6} maxLength={2000} required />
              <button type="submit" disabled={isCommentSubmitting}>{isCommentSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}</button>
            </form>
            {commentState && <p className={`comment-feedback is-${commentState.type}`} role="status">{commentState.message}</p>}
          </section>
        </article>
      </div>

      <div className="news-detail-floating" aria-label="Liên hệ nhanh">
        <a className="quick-phone" href="tel:0986126955" aria-label="Gọi điện">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v2.4a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 3.6 2 2 0 0 1 4.1 1.42h2.4a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.61a2 2 0 0 1-.45 2.11L7.63 8.88a16 16 0 0 0 7.49 7.49l1.02-1.02a2 2 0 0 1 2.11-.45c.84.28 1.71.48 2.61.6A2 2 0 0 1 22 16.92Z" /></svg>
        </a>
        <a className="quick-mail" href="mailto:Hoangthingocmai2005@gmail.com" aria-label="Gửi email">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
        </a>
        <button className="quick-top" type="button" aria-label="Lên đầu trang" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
        </button>
      </div>
    </main>
  )
}

export default NewsDetailPage
