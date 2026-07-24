import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { useCatalog, type CatalogPromotion } from '../hooks/useCatalog'
import { api } from '../services/api'
import { addCartItem, addCartItemAndSync } from '../utils/cart'
import type { ProductReview } from '../utils/reviews'
import { useStoreSettings } from '../utils/storeSettings'
import { getWishlistIds, toggleWishlistId } from '../utils/wishlist'
import './ProductDetailPage.css'

type DetailTab = 'details' | 'brand' | 'returns'

const INITIAL_VISIBLE_REVIEWS = 3

const getReviewerInitials = (name: string) => name
  .trim()
  .split(/\s+/)
  .slice(-2)
  .map((part) => part.charAt(0))
  .join('')
  .toLocaleUpperCase('vi-VN')

const formatReviewDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date(value))

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="detail-review-stars" aria-label={`${rating} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => <i className={star <= rating ? 'filled' : ''} key={star}>★</i>)}
    </span>
  )
}

function ProductDetailPage() {
  const { products, loading } = useCatalog()
  const { slug } = useParams()
  const navigate = useNavigate()
  const product = products.find((item) => item.slug === slug)
  const [activeImage, setActiveImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<DetailTab>('details')
  const [wishlistIds, setWishlistIds] = useState(() => getWishlistIds())
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedVoucher, setSelectedVoucher] = useState<CatalogPromotion | null>(null)
  const [detailPromotions, setDetailPromotions] = useState<CatalogPromotion[]>([])
  const [wishlistToastOpen, setWishlistToastOpen] = useState(false)
  const [productReviews, setProductReviews] = useState<ProductReview[]>([])
  const [showAllReviews, setShowAllReviews] = useState(false)
  const storeSettings = useStoreSettings()

  useEffect(() => {
    if (!product) return
    setActiveImage(product.gallery?.[0] || product.image)
    setQuantity(1)
    setActiveTab('details')
    setShowAllReviews(false)
  }, [product])

  useEffect(() => {
    if (!copiedCode) return
    const timer = window.setTimeout(() => setCopiedCode(null), 2500)
    return () => window.clearTimeout(timer)
  }, [copiedCode])

  useEffect(() => {
    if (!wishlistToastOpen) return
    const timer = window.setTimeout(() => setWishlistToastOpen(false), 4000)
    return () => window.clearTimeout(timer)
  }, [wishlistToastOpen])

  useEffect(() => {
    if (!product) return

    api.get<{ reviews: Array<Omit<ProductReview, 'orderId'>>; promotions: CatalogPromotion[] }>(`/products/${product.slug}`)
      .then((data) => {
        setProductReviews(data.reviews.map((review) => ({ ...review, orderId: '' })))
        setDetailPromotions(data.promotions)
      })
      .catch(() => {
        setProductReviews([])
        setDetailPromotions([])
      })
  }, [product])

  if (loading) return null
  if (!product) return <Navigate to="/404" replace />

  const gallery = ('gallery' in product && Array.isArray(product.gallery) && product.gallery.length)
    ? product.gallery
    : [product.image]
  const isFavorite = wishlistIds.includes(product.id)
  const similarProducts = products.filter((item) => item.id !== product.id).slice(0, 4)
  const savedAmount = product.originalPrice ? product.originalPrice - product.price : 0
  const averageRating = productReviews.length
    ? productReviews.reduce((total, review) => total + review.rating, 0) / productReviews.length
    : 0
  const visibleProductReviews = showAllReviews
    ? productReviews
    : productReviews.slice(0, INITIAL_VISIBLE_REVIEWS)

  const changeGalleryImage = (direction: 'previous' | 'next') => {
    const currentIndex = Math.max(0, gallery.indexOf(activeImage))
    const nextIndex = direction === 'previous'
      ? (currentIndex - 1 + gallery.length) % gallery.length
      : (currentIndex + 1) % gallery.length
    setActiveImage(gallery[nextIndex])
  }

  const copyVoucher = async (code: string) => {
    let copied = false
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(code)
          copied = true
        } catch {
          copied = false
        }
      }
      if (!copied) {
        const textArea = document.createElement('textarea')
        textArea.value = code
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        copied = document.execCommand('copy')
        textArea.remove()
      }
    } finally {
      setCopiedCode(copied ? code : null)
    }
  }

  const handleWishlist = () => {
    const isAdding = !wishlistIds.includes(product.id)
    setWishlistIds(toggleWishlistId(product.id))
    if (isAdding) setWishlistToastOpen(true)
  }

  const handleAddToCart = () => addCartItem(product.id, quantity)

  const handleBuyNow = async () => {
    try {
      await addCartItemAndSync(product.id, quantity)
      navigate('/thanh-toan', { state: { selectedIds: [product.id] } })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.')
    }
  }

  return (
    <main className="product-detail-page">
      <nav className="product-detail-breadcrumb" aria-label="Đường dẫn">
        <div className="product-detail-container">
          <Link to="/">Trang chủ</Link><span>/</span>
          <Link to={`/san-pham?danh-muc=${product.categorySlug}`}>{product.category}</Link><span>/</span>
          <strong>{product.name}</strong>
        </div>
      </nav>

      <section className="product-detail-container product-overview">
        <div className="product-detail-gallery">
          <div className="product-detail-main-image">
            {product.discount && <span className="detail-discount-badge">-{product.discount}%</span>}
            {gallery.length > 1 && (
              <>
                <button className="detail-gallery-arrow previous" type="button" aria-label="Ảnh trước" onClick={() => changeGalleryImage('previous')}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button className="detail-gallery-arrow next" type="button" aria-label="Ảnh tiếp theo" onClick={() => changeGalleryImage('next')}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </>
            )}
            <img src={activeImage || product.image} alt={product.name} />
          </div>
          <div className="product-detail-thumbnails">
            {gallery.map((image) => (
              <button className={activeImage === image ? 'active' : ''} type="button" key={image} onClick={() => setActiveImage(image)}>
                <img src={image} alt={`${product.name} - ảnh sản phẩm`} />
              </button>
            ))}
          </div>
        </div>

        <div className="product-detail-info">
          <div className="product-title-row">
            <div>
              <p className="product-detail-eyebrow">Red Bean Beauty</p>
              <h1>{product.name}</h1>
            </div>
            <button className={`detail-wishlist${isFavorite ? ' active' : ''}`} type="button" aria-label={isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'} onClick={handleWishlist}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" /></svg>
            </button>
          </div>

          <div className="product-detail-meta">
            <span>Thương hiệu: <strong>Red Bean Beauty</strong></span>
            <span>Mã: <strong>RBB-{product.id.padStart(3, '0')}</strong></span>
            <span>Xuất xứ: <strong>{product.origin}</strong></span>
          </div>

          <button
            className="product-rating-summary"
            type="button"
            onClick={() => document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            <ReviewStars rating={Math.round(averageRating)} />
            <strong>{averageRating ? averageRating.toFixed(1) : '0.0'}</strong>
            <span>{productReviews.length} đánh giá đã duyệt</span>
          </button>

          <div className="product-detail-pricing">
            <strong>{formatPrice(product.price)}</strong>
            {product.originalPrice && <del>{formatPrice(product.originalPrice)}</del>}
            {savedAmount > 0 && <p>Tiết kiệm: <span>{formatPrice(savedAmount)}</span></p>}
          </div>

          <p className="product-short-description">{product.description}</p>

          <div className="product-tags">
            {product.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>

          <div className="product-purchase-row">
            <div className="detail-quantity" aria-label="Số lượng">
              <button type="button" aria-label="Giảm số lượng" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <span>{quantity}</span>
              <button type="button" aria-label="Tăng số lượng" onClick={() => setQuantity((value) => value + 1)}>+</button>
            </div>
            <span className="detail-weight">Khối lượng: <strong>{product.weight}</strong></span>
          </div>

          <div className="product-buy-actions">
            <button className="buy-now-button" type="button" disabled={(product.stock ?? 0) <= 0} onClick={() => void handleBuyNow()}>{(product.stock ?? 0) <= 0 ? 'Hết hàng' : 'Mua ngay'}</button>
            <button className="add-cart-button" type="button" disabled={(product.stock ?? 0) <= 0} onClick={handleAddToCart}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M3 4h2l2.4 10.8a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6" /></svg>
              {(product.stock ?? 0) <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            </button>
          </div>

          <div className="payment-methods">
            <span>Phương thức thanh toán</span>
            <div><b>VietQR</b><b>SePay</b><b>COD</b></div>
          </div>

          <div className="product-commitments">
            <span><svg viewBox="0 0 24 24"><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>Giao hàng toàn quốc</span>
            <span><svg viewBox="0 0 24 24"><path d="M12 2l3 6 7 .8-5 4.8 1.5 7-6.5-3.5-6.5 3.5 1.5-7-5-4.8L9 8l3-6Z" /></svg>Cam kết chính hãng</span>
            <span><svg viewBox="0 0 24 24"><path d="M20 7 9 18l-5-5" /></svg>Kiểm tra khi nhận hàng</span>
            <span><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2-5.3M4 4v5h5" /></svg>Hỗ trợ đổi trả</span>
          </div>
        </div>

        <aside className="detail-vouchers" aria-label="Mã ưu đãi">
          <h2>Ưu đãi dành cho bạn</h2>
          {detailPromotions.map((voucher) => (
            <article className="detail-voucher-card" key={voucher.code}>
              <strong>NHẬP MÃ: {voucher.code}</strong>
              <p>{voucher.description}</p>
              <div>
                <button type="button" className={copiedCode === voucher.code ? 'copied' : ''} onClick={() => void copyVoucher(voucher.code)}>{copiedCode === voucher.code ? 'Đã sao chép' : 'Sao chép'}</button>
                <button type="button" onClick={() => setSelectedVoucher(voucher)}>Điều kiện</button>
              </div>
            </article>
          ))}
        </aside>
      </section>

      <section className="product-detail-container product-information">
        <div className="product-info-tabs" role="tablist" aria-label="Thông tin sản phẩm">
          <button type="button" role="tab" aria-selected={activeTab === 'details'} className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>Thông tin chi tiết</button>
          <button type="button" role="tab" aria-selected={activeTab === 'brand'} className={activeTab === 'brand' ? 'active' : ''} onClick={() => setActiveTab('brand')}>Thương hiệu</button>
          <button type="button" role="tab" aria-selected={activeTab === 'returns'} className={activeTab === 'returns' ? 'active' : ''} onClick={() => setActiveTab('returns')}>Chính sách đổi trả</button>
        </div>

        <div className="product-info-content">
          {activeTab === 'details' && (
            <div className="product-detail-description">
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <div className="detail-specifications">
                <div><span>Khối lượng</span><strong>{product.weight}</strong></div>
                <div><span>Xuất xứ</span><strong>{product.origin}</strong></div>
                <div><span>Loại sản phẩm</span><strong>{product.category}</strong></div>
              </div>
              <h3>Thành phần nổi bật</h3>
              <ul>{product.mainIngredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul>
              <h3>Hướng dẫn sử dụng</h3>
              <p>Lấy một lượng sản phẩm vừa đủ, sử dụng theo đúng bước trong chu trình chăm sóc da. Tránh vùng mắt và vùng da đang tổn thương. Ngưng sử dụng nếu xuất hiện dấu hiệu kích ứng.</p>
              {gallery[1] && <img className="product-description-image" src={gallery[1]} alt={`Thông tin ${product.name}`} />}
            </div>
          )}

          {activeTab === 'brand' && (
            <div className="product-detail-description">
              <h2>Red Bean Beauty</h2>
              <p>Red Bean Beauty phát triển các sản phẩm chăm sóc da từ hạt đậu đỏ Việt Nam, hướng đến chu trình làm đẹp dịu nhẹ, thuận tiện và phù hợp với nhu cầu chăm sóc da hằng ngày.</p>
              <p>Sản phẩm được lựa chọn thành phần rõ ràng, tập trung vào làm sạch, dưỡng ẩm và hỗ trợ làn da sáng khỏe.</p>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="product-detail-description">
              <h2>Chính sách đổi trả sản phẩm</h2>
              <p>Hỗ trợ đổi trả khi sản phẩm giao sai, thiếu số lượng, bị bể vỡ hoặc có lỗi chất lượng được Red Bean Beauty xác nhận. Khách hàng cần thông báo trong vòng 48 giờ kể từ khi nhận hàng.</p>
              <Link className="detail-policy-link" to="/chinh-sach-doi-tra">Xem chính sách đổi trả đầy đủ</Link>
            </div>
          )}
        </div>
      </section>

      <section className="product-detail-container product-reviews-section" id="product-reviews">
        <header className="product-reviews-heading">
          <p>Trải nghiệm khách hàng</p>
          <h2>Đánh giá sản phẩm</h2>
        </header>

        <div className="product-reviews-layout">
          <aside className="product-rating-overview" aria-label="Tổng quan đánh giá">
            <strong>{averageRating ? averageRating.toFixed(1) : '0.0'}</strong>
            <ReviewStars rating={Math.round(averageRating)} />
            <span>{productReviews.length} đánh giá đã được duyệt</span>

            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = productReviews.filter((review) => review.rating === rating).length
                const percentage = productReviews.length ? (count / productReviews.length) * 100 : 0
                return (
                  <div className="rating-distribution-row" key={rating}>
                    <span>{rating} ★</span>
                    <i><b style={{ width: `${percentage}%` }} /></i>
                    <small>{count}</small>
                  </div>
                )
              })}
            </div>
          </aside>

          <div className="product-review-list">
            {productReviews.length > 0 ? (
              <>
                {visibleProductReviews.map((review) => (
                  <article className="product-review-card" key={review.id}>
                    <div className="reviewer-avatar" aria-hidden="true">{getReviewerInitials(review.userName)}</div>
                    <div className="product-review-content">
                      <div className="product-review-topline">
                        <div>
                          <strong>{review.userName}</strong>
                          {review.verifiedPurchase ? <span>Đã mua hàng</span> : null}
                        </div>
                        <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time>
                      </div>
                      <ReviewStars rating={review.rating} />
                      <p>{review.comment}</p>

                      {review.reply ? (
                        <div className="store-review-reply">
                          <strong>Phản hồi từ {storeSettings.storeName}</strong>
                          <p>{review.reply}</p>
                          {review.replyAt ? <time dateTime={review.replyAt}>{formatReviewDate(review.replyAt)}</time> : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}

                {productReviews.length > INITIAL_VISIBLE_REVIEWS ? (
                  <div className="product-review-list-actions">
                    <button
                      type="button"
                      className="product-review-toggle"
                      aria-expanded={showAllReviews}
                      onClick={() => setShowAllReviews((current) => !current)}
                    >
                      {showAllReviews ? 'Thu gọn đánh giá' : `Xem tất cả ${productReviews.length} đánh giá`}
                      <span aria-hidden="true">{showAllReviews ? '↑' : '↓'}</span>
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="product-reviews-empty">
                <strong>Chưa có đánh giá được duyệt</strong>
                <p>Đánh giá từ khách hàng đã mua sản phẩm sẽ xuất hiện tại đây sau khi được cửa hàng xác nhận.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="product-detail-container similar-products-section">
        <header><p>Khám phá thêm</p><h2>Sản phẩm tương tự</h2><span /></header>
        <div className="similar-products-grid">
          {similarProducts.map((item) => (
            <article className="similar-product-card" key={item.id}>
              <Link className="similar-product-image" to={`/san-pham/${item.slug}`}>
                {item.discount && <span>-{item.discount}%</span>}
                <img src={item.image} alt={item.name} />
              </Link>
              <p>RED BEAN BEAUTY</p>
              <h3><Link to={`/san-pham/${item.slug}`}>{item.name}</Link></h3>
              <div><strong>{formatPrice(item.price)}</strong>{item.originalPrice && <del>{formatPrice(item.originalPrice)}</del>}</div>
            </article>
          ))}
        </div>
      </section>

      {wishlistToastOpen && (
        <div className="detail-wishlist-toast" role="status" aria-live="polite">
          <button type="button" aria-label="Đóng thông báo" onClick={() => setWishlistToastOpen(false)}>×</button>
          <strong>Tuyệt vời</strong>
          <p>
            Bạn vừa thêm sản phẩm vào mục yêu thích thành công.{' '}
            <Link to="/yeu-thich" onClick={() => setWishlistToastOpen(false)}>Xem danh sách yêu thích</Link>
          </p>
        </div>
      )}

      {selectedVoucher && (
        <div className="detail-voucher-modal-overlay" role="presentation" onClick={() => setSelectedVoucher(null)}>
          <div className="detail-voucher-modal" role="dialog" aria-modal="true" aria-labelledby="detail-voucher-title" onClick={(event) => event.stopPropagation()}>
            <button className="detail-voucher-close" type="button" aria-label="Đóng" onClick={() => setSelectedVoucher(null)}>×</button>
            <h2 id="detail-voucher-title">NHẬP MÃ: {selectedVoucher.code}</h2>
            <p>{selectedVoucher.conditions.join(' ')}</p>
            <button className="detail-voucher-copy" type="button" onClick={() => void copyVoucher(selectedVoucher.code)}>{copiedCode === selectedVoucher.code ? 'Đã sao chép' : 'Sao chép mã'}</button>
          </div>
        </div>
      )}
    </main>
  )
}

export default ProductDetailPage
