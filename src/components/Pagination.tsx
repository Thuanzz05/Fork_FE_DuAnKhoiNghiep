import './Pagination.css'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  itemLabel?: string
}

function buildPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  return [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'mục',
}: PaginationProps) {
  if (totalItems === 0 || totalPages <= 1) return null

  const firstItem = (currentPage - 1) * pageSize + 1
  const lastItem = Math.min(currentPage * pageSize, totalItems)
  const pages = buildPageNumbers(currentPage, totalPages)

  const changePage = (page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) return
    onPageChange(page)
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  return (
    <nav className="pagination" aria-label="Phân trang">
      <span className="pagination-summary">
        Hiển thị {firstItem}-{lastItem} / {totalItems} {itemLabel}
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-arrow"
          disabled={currentPage === 1}
          onClick={() => changePage(currentPage - 1)}
          aria-label="Trang trước"
        >
          ‹
        </button>

        {pages.map((page, index) => (
          <span className="pagination-page-slot" key={page}>
            {index > 0 && page - pages[index - 1] > 1 ? <span className="pagination-ellipsis">…</span> : null}
            <button
              type="button"
              className={`pagination-number${page === currentPage ? ' active' : ''}`}
              onClick={() => changePage(page)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          </span>
        ))}

        <button
          type="button"
          className="pagination-arrow"
          disabled={currentPage === totalPages}
          onClick={() => changePage(currentPage + 1)}
          aria-label="Trang sau"
        >
          ›
        </button>
      </div>
    </nav>
  )
}

export default Pagination
