import { useEffect, useMemo, useState } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import { products, type Product } from '../../data/products'
import {
  getReviews,
  saveReviews,
  type ProductReview,
  type ReviewModerationStatus,
} from '../../utils/reviews'
import './AdminReviewsPage.css'

type ReviewSort = 'newest' | 'oldest' | 'highest' | 'lowest'

interface ManagedReview extends ProductReview {
  status: ReviewModerationStatus
  reply?: string
  replyAt?: string
  verifiedPurchase: boolean
}

const seedReviews: ManagedReview[] = [
  { id: 'review-001', orderId: 'admin-order-8', productId: '1', userId: 'customer-007', userName: 'Đỗ Minh Thư', rating: 5, comment: 'Combo đóng gói rất đẹp, mùi nhẹ và dùng đủ ba bước da mềm hơn hẳn. Mình sẽ tiếp tục sử dụng.', createdAt: '2026-07-14T09:24:00+07:00', status: 'approved', verifiedPurchase: true, reply: 'Rubeanora cảm ơn bạn đã tin dùng bộ sản phẩm. Chúc bạn luôn có làn da khỏe đẹp!', replyAt: '2026-07-14T10:10:00+07:00' },
  { id: 'review-002', orderId: 'admin-order-10', productId: '2', userId: 'customer-009', userName: 'Bùi Đức Long', rating: 4, comment: 'Sữa rửa mặt tạo bọt mịn, rửa xong không bị khô căng. Giao hàng hơi chậm một chút nhưng sản phẩm ổn.', createdAt: '2026-07-14T08:15:00+07:00', status: 'pending', verifiedPurchase: true },
  { id: 'review-003', orderId: 'admin-order-5', productId: '3', userId: 'customer-003', userName: 'Phạm Quốc Bảo', rating: 5, comment: 'Mặt nạ có hạt mịn, tẩy tế bào chết khá dịu. Sau vài lần dùng da sáng và đều màu hơn.', createdAt: '2026-07-13T20:42:00+07:00', status: 'approved', verifiedPurchase: true, reply: 'Cảm ơn bạn đã chia sẻ trải nghiệm thực tế với mặt nạ đậu đỏ.', replyAt: '2026-07-14T07:30:00+07:00' },
  { id: 'review-004', orderId: 'admin-order-4', productId: '4', userId: 'customer-004', userName: 'Vũ Ngọc Hà', rating: 3, comment: 'Toner cấp ẩm ổn nhưng phần nắp chai của mình hơi lỏng. Mong shop kiểm tra kỹ hơn trước khi gửi.', createdAt: '2026-07-13T15:05:00+07:00', status: 'pending', verifiedPurchase: true },
  { id: 'review-005', orderId: 'admin-order-9', productId: '5', userId: 'customer-008', userName: 'Hoàng Mai Phương', rating: 2, comment: 'Nội dung chứa liên kết quảng cáo không liên quan đến sản phẩm.', createdAt: '2026-07-12T18:30:00+07:00', status: 'hidden', verifiedPurchase: false },
  { id: 'review-006', orderId: 'admin-order-7', productId: '6', userId: 'customer-006', userName: 'Nguyễn Lan Anh', rating: 5, comment: 'Serum thấm nhanh, không bết dính. Dùng buổi tối khoảng hai tuần thấy da có độ bóng khỏe hơn.', createdAt: '2026-07-11T16:48:00+07:00', status: 'approved', verifiedPurchase: true },
  { id: 'review-007', orderId: 'admin-order-9', productId: '7', userId: 'customer-008', userName: 'Hoàng Mai Phương', rating: 4, comment: 'Kem dưỡng mềm, hợp da khô. Mình thích thiết kế bao bì và mùi đậu đỏ rất nhẹ.', createdAt: '2026-07-10T11:22:00+07:00', status: 'pending', verifiedPurchase: true },
  { id: 'review-008', orderId: 'admin-order-12', productId: '4', userId: 'customer-011', userName: 'Trịnh Khánh Linh', rating: 5, comment: 'Toner làm dịu da tốt, dùng sau khi rửa mặt rất dễ chịu. Chai chắc chắn và giao đủ số lượng.', createdAt: '2026-07-09T09:16:00+07:00', status: 'approved', verifiedPurchase: true },
]

const statusMeta: Record<ReviewModerationStatus, { label: string; tone: string }> = {
  pending: { label: 'Chờ duyệt', tone: 'pending' },
  approved: { label: 'Đã hiển thị', tone: 'approved' },
  hidden: { label: 'Đã ẩn', tone: 'hidden' },
}

const buildInitialReviews = (): ManagedReview[] => {
  const reviewMap = new Map(seedReviews.map((review) => [review.id, review]))
  getReviews().forEach((review) => reviewMap.set(review.id, {
    ...review,
    status: review.status ?? 'pending',
    verifiedPurchase: review.verifiedPurchase ?? true,
  }))
  return Array.from(reviewMap.values())
}

const getProduct = (productId: string): Product | undefined => products.find((product) => product.id === productId)

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value))

const getInitials = (name: string) => name
  .trim()
  .split(/\s+/)
  .slice(-2)
  .map((part) => part.charAt(0))
  .join('')
  .toLocaleUpperCase('vi-VN')

function RatingStars({ rating }: { rating: number }) {
  return <span className="admin-review-stars" aria-label={`${rating} trên 5 sao`}>{[1, 2, 3, 4, 5].map((star) => <i key={star} className={star <= rating ? 'is-filled' : ''}>★</i>)}</span>
}

function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ManagedReview[]>(buildInitialReviews)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewModerationStatus>('all')
  const [ratingFilter, setRatingFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all')
  const [productFilter, setProductFilter] = useState('all')
  const [sortBy, setSortBy] = useState<ReviewSort>('newest')
  const [selectedReview, setSelectedReview] = useState<ManagedReview | null>(null)
  const [deletingReview, setDeletingReview] = useState<ManagedReview | null>(null)
  const [draftStatus, setDraftStatus] = useState<ReviewModerationStatus>('pending')
  const [draftReply, setDraftReply] = useState('')
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!selectedReview && !deletingReview) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedReview(null)
        setDeletingReview(null)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [deletingReview, selectedReview])

  const persistReviews = (nextReviews: ManagedReview[]) => {
    setReviews(nextReviews)
    saveReviews(nextReviews)
  }

  const filteredReviews = useMemo(() => {
    const keyword = searchValue.trim().toLocaleLowerCase('vi-VN')
    const result = reviews.filter((review) => {
      const product = getProduct(review.productId)
      const matchesKeyword = !keyword || [review.userName, review.comment, review.orderId, product?.name ?? '']
        .some((value) => value.toLocaleLowerCase('vi-VN').includes(keyword))
      const matchesStatus = statusFilter === 'all' || review.status === statusFilter
      const matchesRating = ratingFilter === 'all' || review.rating === Number(ratingFilter)
      const matchesProduct = productFilter === 'all' || review.productId === productFilter
      return matchesKeyword && matchesStatus && matchesRating && matchesProduct
    })

    return result.sort((first, second) => {
      if (sortBy === 'oldest') return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
      if (sortBy === 'highest') return second.rating - first.rating
      if (sortBy === 'lowest') return first.rating - second.rating
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    })
  }, [productFilter, ratingFilter, reviews, searchValue, sortBy, statusFilter])

  const pendingCount = reviews.filter((review) => review.status === 'pending').length
  const approvedCount = reviews.filter((review) => review.status === 'approved').length
  const averageRating = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0

  const openReviewDetail = (review: ManagedReview) => {
    setSelectedReview(review)
    setDraftStatus(review.status)
    setDraftReply(review.reply ?? '')
  }

  const updateReviewStatus = (review: ManagedReview, status: ReviewModerationStatus) => {
    persistReviews(reviews.map((item) => item.id === review.id ? { ...item, status } : item))
    setNotice({ message: status === 'approved' ? 'Đã duyệt và hiển thị đánh giá' : 'Đã ẩn đánh giá khỏi cửa hàng', type: 'success' })
  }

  const saveReviewDetail = () => {
    if (!selectedReview) return
    const reply = draftReply.trim()
    const updatedReview: ManagedReview = {
      ...selectedReview,
      status: draftStatus,
      reply: reply || undefined,
      replyAt: reply ? new Date().toISOString() : undefined,
    }
    persistReviews(reviews.map((review) => review.id === selectedReview.id ? updatedReview : review))
    setSelectedReview(updatedReview)
    setNotice({ message: 'Đã cập nhật đánh giá và phản hồi', type: 'success' })
  }

  const confirmDelete = () => {
    if (!deletingReview) return
    persistReviews(reviews.filter((review) => review.id !== deletingReview.id))
    setNotice({ message: `Đã xóa đánh giá của ${deletingReview.userName}`, type: 'success' })
    setDeletingReview(null)
  }

  return (
    <AdminLayout activeItem="reviews" searchValue={searchValue} onSearchChange={setSearchValue} searchPlaceholder="Tìm khách hàng, sản phẩm hoặc nội dung đánh giá...">
      <div className="admin-page-heading admin-reviews-heading">
        <div><p>CHĂM SÓC KHÁCH HÀNG</p><h1>Quản lý đánh giá</h1><span>Kiểm duyệt phản hồi và trả lời khách hàng sau khi mua sản phẩm.</span></div>
      </div>

      <section className="admin-review-summary" aria-label="Tổng quan đánh giá">
        <article><span className="is-red"><AdminIcon name="star" /></span><div><small>Tổng đánh giá</small><strong>{reviews.length}</strong></div></article>
        <article><span className="is-orange"><AdminIcon name="calendar" /></span><div><small>Chờ duyệt</small><strong>{pendingCount}</strong></div></article>
        <article><span className="is-green"><AdminIcon name="eye" /></span><div><small>Đang hiển thị</small><strong>{approvedCount}</strong></div></article>
        <article><span className="is-blue"><AdminIcon name="star" /></span><div><small>Điểm trung bình</small><strong>{averageRating.toFixed(1)} <b>/ 5</b></strong></div></article>
      </section>

      <section className="admin-reviews-panel">
        <div className="admin-reviews-toolbar">
          <div>
            <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ReviewModerationStatus)}><option value="all">Tất cả trạng thái</option><option value="pending">Chờ duyệt</option><option value="approved">Đã hiển thị</option><option value="hidden">Đã ẩn</option></select></label>
            <label><span>Số sao</span><select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value as typeof ratingFilter)}><option value="all">Tất cả số sao</option>{[5, 4, 3, 2, 1].map((rating) => <option value={rating} key={rating}>{rating} sao</option>)}</select></label>
            <label><span>Sản phẩm</span><select value={productFilter} onChange={(event) => setProductFilter(event.target.value)}><option value="all">Tất cả sản phẩm</option>{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label>
            <label><span>Sắp xếp</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as ReviewSort)}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="highest">Số sao cao nhất</option><option value="lowest">Số sao thấp nhất</option></select></label>
          </div>
          <span>Hiển thị <strong>{filteredReviews.length}</strong> / {reviews.length} đánh giá</span>
        </div>

        <div className="admin-reviews-table-wrap">
          <table className="admin-reviews-table">
            <thead><tr><th>Khách hàng & đánh giá</th><th>Sản phẩm</th><th>Số sao</th><th>Trạng thái</th><th>Ngày gửi</th><th>Phản hồi</th><th>Thao tác</th></tr></thead>
            <tbody>{filteredReviews.map((review) => {
              const product = getProduct(review.productId)
              const status = statusMeta[review.status]
              return <tr key={review.id}>
                <td><div className="admin-review-customer-cell"><span>{getInitials(review.userName)}</span><div><strong>{review.userName}{review.verifiedPurchase ? <em>Đã mua hàng</em> : null}</strong><p>{review.comment || 'Khách hàng không để lại nội dung.'}</p><small>Đơn hàng: {review.orderId}</small></div></div></td>
                <td><div className="admin-review-product-cell">{product ? <img src={product.image} alt="" /> : <span><AdminIcon name="products" /></span>}<div><strong>{product?.name ?? 'Sản phẩm không còn tồn tại'}</strong><small>{product?.category ?? 'Chưa xác định'}</small></div></div></td>
                <td><div className="admin-review-rating"><RatingStars rating={review.rating} /><strong>{review.rating}.0</strong></div></td>
                <td><span className={`admin-review-status is-${status.tone}`}><i />{status.label}</span></td>
                <td><span className="admin-review-date">{formatDateTime(review.createdAt)}</span></td>
                <td><span className={`admin-review-reply-state${review.reply ? ' has-reply' : ''}`}>{review.reply ? 'Đã phản hồi' : 'Chưa phản hồi'}</span></td>
                <td><div className="admin-review-actions"><button type="button" onClick={() => openReviewDetail(review)} title="Xem và phản hồi" aria-label={`Xem đánh giá của ${review.userName}`}><AdminIcon name="eye" /></button>{review.status !== 'approved' ? <button type="button" className="is-approve" onClick={() => updateReviewStatus(review, 'approved')} title="Duyệt đánh giá" aria-label="Duyệt đánh giá"><AdminIcon name="play" /></button> : <button type="button" onClick={() => updateReviewStatus(review, 'hidden')} title="Ẩn đánh giá" aria-label="Ẩn đánh giá"><AdminIcon name="pause" /></button>}<button type="button" className="is-danger" onClick={() => setDeletingReview(review)} title="Xóa đánh giá" aria-label="Xóa đánh giá"><AdminIcon name="trash" /></button></div></td>
              </tr>
            })}</tbody>
          </table>
          {filteredReviews.length === 0 ? <div className="admin-reviews-empty"><AdminIcon name="search" /><strong>Không tìm thấy đánh giá</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span></div> : null}
        </div>
      </section>

      {selectedReview ? (
        <div className="admin-review-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedReview(null)}>
          <section className="admin-review-detail-modal" role="dialog" aria-modal="true" aria-labelledby="admin-review-detail-title">
            <header><div><span>CHI TIẾT ĐÁNH GIÁ</span><h2 id="admin-review-detail-title">Phản hồi khách hàng</h2></div><button type="button" onClick={() => setSelectedReview(null)} aria-label="Đóng"><AdminIcon name="close" /></button></header>
            <div className="admin-review-detail-body">
              <div className="admin-review-detail-overview">
                <div className="admin-review-detail-customer"><span>{getInitials(selectedReview.userName)}</span><div><strong>{selectedReview.userName}</strong><small>{selectedReview.verifiedPurchase ? 'Đã mua sản phẩm' : 'Chưa xác minh mua hàng'} · {formatDateTime(selectedReview.createdAt)}</small></div></div>
                <div className="admin-review-detail-rating"><RatingStars rating={selectedReview.rating} /><strong>{selectedReview.rating}/5</strong></div>
              </div>
              <blockquote>{selectedReview.comment || 'Khách hàng không để lại nội dung.'}</blockquote>
              <div className="admin-review-detail-product">{getProduct(selectedReview.productId) ? <img src={getProduct(selectedReview.productId)?.image} alt="" /> : null}<div><span>SẢN PHẨM ĐƯỢC ĐÁNH GIÁ</span><strong>{getProduct(selectedReview.productId)?.name ?? 'Sản phẩm không còn tồn tại'}</strong><small>Mã đơn: {selectedReview.orderId}</small></div></div>
              <div className="admin-review-moderation-form">
                <label><span>Trạng thái hiển thị</span><select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as ReviewModerationStatus)}><option value="pending">Chờ duyệt</option><option value="approved">Duyệt và hiển thị</option><option value="hidden">Ẩn khỏi cửa hàng</option></select></label>
                <label><span>Phản hồi của cửa hàng</span><textarea rows={5} maxLength={500} value={draftReply} onChange={(event) => setDraftReply(event.target.value)} placeholder="Nhập lời cảm ơn hoặc hỗ trợ khách hàng..." /><small>{draftReply.length}/500 ký tự</small></label>
              </div>
            </div>
            <footer><button type="button" className="admin-review-secondary" onClick={() => setSelectedReview(null)}>Đóng</button><button type="button" className="admin-review-primary" onClick={saveReviewDetail}>Lưu thay đổi</button></footer>
          </section>
        </div>
      ) : null}

      {deletingReview ? (
        <div className="admin-review-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDeletingReview(null)}>
          <section className="admin-review-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="admin-review-delete-title"><span><AdminIcon name="trash" /></span><h2 id="admin-review-delete-title">Xóa đánh giá?</h2><p>Đánh giá của <strong>{deletingReview.userName}</strong> sẽ bị xóa khỏi dữ liệu. Hành động này không thể hoàn tác trên giao diện hiện tại.</p><div><button type="button" className="admin-review-secondary" onClick={() => setDeletingReview(null)}>Hủy</button><button type="button" className="admin-review-danger" onClick={confirmDelete}>Xóa đánh giá</button></div></section>
        </div>
      ) : null}

      {notice ? <div className={`admin-review-toast is-${notice.type}`} role="status"><span>{notice.type === 'success' ? '✓' : '!'}</span>{notice.message}</div> : null}
    </AdminLayout>
  )
}

export default AdminReviewsPage
