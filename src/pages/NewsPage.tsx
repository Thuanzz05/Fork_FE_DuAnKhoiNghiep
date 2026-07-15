import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Pagination from '../components/Pagination'
import { newsArticles } from '../data/news'
import { usePagination } from '../hooks/usePagination'
import './NewsPage.css'

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  )
}

function NewsPage() {
  const [contentState, setContentState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadVersion, setLoadVersion] = useState(0)
  const { currentPage, totalPages, pageItems, setCurrentPage } = usePagination(newsArticles, 3)

  useEffect(() => {
    setContentState('loading')
    const timerId = window.setTimeout(() => {
      setContentState(Array.isArray(newsArticles) ? 'ready' : 'error')
    }, 450)

    return () => window.clearTimeout(timerId)
  }, [loadVersion])

  return (
    <main className="news-page">
      <section className="news-container" aria-labelledby="news-title">
        <header className="news-heading">
          <p>Cẩm nang làm đẹp</p>
          <h1 id="news-title">Tin tức</h1>
          <span aria-hidden="true" />
        </header>

        <div className="news-grid">
          {contentState === 'loading' &&
            Array.from({ length: 3 }, (_, index) => (
              <article className="news-card news-card-skeleton" key={`news-skeleton-${index}`} aria-hidden="true">
                <span className="news-skeleton-block news-skeleton-image" />
                <div className="news-card-body">
                  <span className="news-skeleton-block news-skeleton-title" />
                  <span className="news-skeleton-block news-skeleton-title short" />
                  <span className="news-skeleton-block news-skeleton-line" />
                  <span className="news-skeleton-block news-skeleton-meta" />
                </div>
              </article>
            ))}

          {contentState === 'ready' && pageItems.map((article) => (
            <article className="news-card" key={article.id}>
              <Link className="news-image-link" to={`/tin-tuc/${article.id}`} aria-label={article.title}>
                <img src={article.image} alt={article.title} />
              </Link>

              <div className="news-card-body">
                <h2>
                  <Link to={`/tin-tuc/${article.id}`}>{article.title}</Link>
                </h2>
                <p className="news-excerpt">{article.excerpt}</p>

                <div className="news-meta">
                  <span><UserIcon />Red Bean Beauty</span>
                  <span><CalendarIcon />{article.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {contentState === 'error' ? (
          <div className="news-status news-error" role="alert">
            <strong>Không thể tải danh sách tin tức</strong>
            <p>Đã có lỗi xảy ra. Vui lòng thử tải lại dữ liệu.</p>
            <button type="button" onClick={() => setLoadVersion((version) => version + 1)}>Thử lại</button>
          </div>
        ) : null}

        {contentState === 'ready' && newsArticles.length === 0 ? (
          <div className="news-status news-empty">
            <strong>Chưa có bài viết</strong>
            <p>Các nội dung chăm sóc da mới sẽ sớm được cập nhật.</p>
          </div>
        ) : null}

        {contentState === 'ready' ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={newsArticles.length}
            pageSize={3}
            itemLabel="bài viết"
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>
    </main>
  )
}

export default NewsPage
