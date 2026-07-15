import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { categories, formatPrice, products } from '../data/products'
import type { Product } from '../data/products'
import { addCartItem } from '../utils/cart'
import { getWishlistIds, toggleWishlistId } from '../utils/wishlist'
import Pagination from '../components/Pagination'
import { usePagination } from '../hooks/usePagination'
import './ProductsPage.css'

const promoCodes = [
  {
    code: 'REDBEAN',
    title: 'NHẬP MÃ: REDBEAN',
    description: 'Giảm 10% cho đơn hàng đầu tiên',
    conditions: ['Áp dụng cho khách hàng mua lần đầu', 'Giảm 10% cho đơn hàng từ 200K'],
  },
  {
    code: 'COMBO20',
    title: 'NHẬP MÃ: COMBO20',
    description: 'Giảm 20% khi mua Combo 3 món',
    conditions: ['Áp dụng cho sản phẩm combo', 'Giảm 20% cho combo chăm sóc da đậu đỏ 3 món'],
  },
  {
    code: 'FREESHIP',
    title: 'NHẬP MÃ: FREESHIP',
    description: 'Miễn phí ship cho đơn từ 300K',
    conditions: ['Áp dụng toàn quốc', 'Miễn phí vận chuyển cho đơn hàng từ 300K'],
  },
  {
    code: 'SKINCARE',
    title: 'NHẬP MÃ: SKINCARE',
    description: 'Tặng mẫu thử khi mua từ 250K',
    conditions: ['Áp dụng khi đơn hàng từ 250K', 'Quà tặng được gửi kèm theo đơn hàng'],
  },
]

const productGalleries: Record<string, string[]> = {
  '1': [
    '/images/products/combo-3mon6.jpg',
    '/images/products/combo-3mon.jpg',
    '/images/products/combo-3mon2.png',
    '/images/products/combo-3mon3.png',
  ],
  '2': [
    '/images/products/sua-rua-mat-tao-bot3.jpg',
    '/images/products/sua-rua-mat-tao-bot1.png',
    '/images/products/sua-rua-mat-tao-bot2.png',
    '/images/products/sua-rua-mat-tao-bot4.png',
  ],
  '3': [
    '/images/products/mat-na-tay-te-bao-chet6.jpg',
    '/images/products/mat-na-tay-te-bao-chet1.jpg',
    '/images/products/mat-na-tay-te-bao-chet2.jpg',
    '/images/products/mat-na-tay-te-bao-chet4.png',
  ],
  '4': [
    '/images/products/toner-duong-da4.jpg',
    '/images/products/toner-duong-da1.png',
    '/images/products/toner-duong-da2.jpg',
    '/images/products/toner-duong-da3.jpg',
  ],
  '5': [
    '/images/products/combo-duong-da-mini4.png',
    '/images/products/combo-duong-da-mini.png',
    '/images/products/combo-duong-da-mini2.jpg',
    '/images/products/combo-duong-da-mini3.jpg',
  ],
}

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategorySlug = searchParams.get('danh-muc') || 'tat-ca'
  const [sortBy, setSortBy] = useState('default')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedPromo, setSelectedPromo] = useState<(typeof promoCodes)[number] | null>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [quickViewImage, setQuickViewImage] = useState('')
  const [quickViewQuantity, setQuickViewQuantity] = useState(1)
  const [wishlistIds, setWishlistIds] = useState(() => getWishlistIds())
  const [wishlistToastOpen, setWishlistToastOpen] = useState(false)
  const [copiedPromoCode, setCopiedPromoCode] = useState<string | null>(null)
  const [contentState, setContentState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadVersion, setLoadVersion] = useState(0)

  const activeCategory = categories.find((category) => category.slug === activeCategorySlug)

  const filteredProducts = useMemo(() => {
    const result =
      activeCategorySlug === 'tat-ca'
        ? [...products]
        : products.filter((product) => product.categorySlug === activeCategorySlug)

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
        break
      case 'discount':
        result.sort((a, b) => (b.discount || 0) - (a.discount || 0))
        break
    }

    return result
  }, [activeCategorySlug, sortBy])

  const {
    currentPage,
    totalPages,
    pageItems: paginatedProducts,
    setCurrentPage,
  } = usePagination(filteredProducts, 6, `${activeCategorySlug}|${sortBy}`)

  useEffect(() => {
    setContentState('loading')
    const timerId = window.setTimeout(() => {
      setContentState(Array.isArray(products) ? 'ready' : 'error')
    }, 450)

    return () => window.clearTimeout(timerId)
  }, [loadVersion])

  const handleCategoryChange = (slug: string) => {
    if (slug === 'tat-ca') {
      setSearchParams({})
    } else {
      setSearchParams({ 'danh-muc': slug })
    }
  }

  const closePromoModal = () => setSelectedPromo(null)

  const copyPromoCode = async (code: string) => {
    try {
      let copied = false

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

      setCopiedPromoCode(copied ? code : null)
    } catch {
      setCopiedPromoCode(null)
    }
  }

  const openQuickView = (product: Product) => {
    setQuickViewProduct(product)
    setQuickViewImage(product.image)
    setQuickViewQuantity(1)
  }

  const closeQuickView = () => setQuickViewProduct(null)

  const quickViewGallery = quickViewProduct ? productGalleries[quickViewProduct.id] || [quickViewProduct.image] : []

  useEffect(() => {
    if (!wishlistToastOpen) return

    const timerId = window.setTimeout(() => {
      setWishlistToastOpen(false)
    }, 4200)

    return () => window.clearTimeout(timerId)
  }, [wishlistToastOpen])

  useEffect(() => {
    if (!copiedPromoCode) return

    const timerId = window.setTimeout(() => setCopiedPromoCode(null), 2500)
    return () => window.clearTimeout(timerId)
  }, [copiedPromoCode])

  const handleToggleWishlist = (product: Product) => {
    const alreadyFavorite = wishlistIds.includes(product.id)
    const nextWishlistIds = toggleWishlistId(product.id)

    setWishlistIds(nextWishlistIds)

    if (!alreadyFavorite) {
      setWishlistToastOpen(true)
    }
  }

  const handleAddToCart = (productId: string, quantity = 1) => {
    addCartItem(productId, quantity)
  }

  return (
    <div className="products-page">
      <div className="products-breadcrumb">
        <div className="products-container">
          <Link to="/">Trang chủ</Link>
          <span className="breadcrumb-sep">/</span>
          <span>{activeCategory?.name || 'Tất cả sản phẩm'}</span>
        </div>
      </div>

      <div className="products-container">
        <div className="promo-grid">
          {promoCodes.map((promo) => (
            <div className="promo-card" key={promo.code}>
              <strong>{promo.title}</strong>
              <p>{promo.description}</p>
              <div className="promo-actions">
                <button
                  type="button"
                  className={`promo-copy${copiedPromoCode === promo.code ? ' copied' : ''}`}
                  onClick={() => copyPromoCode(promo.code)}
                  aria-label={`Sao chép mã ${promo.code}`}
                >
                  {copiedPromoCode === promo.code ? 'Đã sao chép' : 'Sao chép mã'}
                </button>
                <button type="button" className="promo-cond" onClick={() => setSelectedPromo(promo)}>
                  Điều kiện
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile filter toggle */}
      {!filterOpen && (
        <div className="products-container mobile-filter-bar">
          <button
            type="button"
            className="mobile-filter-btn"
            onClick={() => setFilterOpen(true)}
            aria-expanded={filterOpen}
            aria-label="Mở bộ lọc"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
          </button>
        </div>
      )}

      {/* Mobile filter overlay */}
      {filterOpen && (
        <div className="filter-overlay" role="presentation" onClick={() => setFilterOpen(false)} />
      )}

      <div className="products-container products-layout">
        {/* Floating close button (slides in with sidebar) */}
        <button 
          type="button" 
          className={`sidebar-floating-close${filterOpen ? ' sidebar-open' : ''}`}
          onClick={() => setFilterOpen(false)} 
          aria-label="Đóng bộ lọc"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" strokeWidth="3" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <aside className={`products-sidebar${filterOpen ? ' sidebar-open' : ''}`}>
          <div className="sidebar-section">
            <h3 className="sidebar-title">
              Loại sản phẩm
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </h3>
            <ul className="sidebar-list">
              {categories.map((category) => (
                <li key={category.slug}>
                  <button
                    type="button"
                    className={`sidebar-filter${activeCategorySlug === category.slug ? ' active' : ''}`}
                    onClick={() => handleCategoryChange(category.slug)}
                  >
                    <span className="filter-check" />
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="products-main">
          <div className="products-header">
            <h1 className="products-title">{activeCategory?.name || 'Tất cả sản phẩm'}</h1>
            <div className="products-sort">
              <label htmlFor="sort-select">Sắp xếp:</label>
              <select id="sort-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá: Thấp → Cao</option>
                <option value="price-desc">Giá: Cao → Thấp</option>
                <option value="name-asc">Tên A → Z</option>
                <option value="discount">Giảm giá nhiều</option>
              </select>
            </div>
          </div>

          <div className="products-grid">
            {contentState === 'loading' &&
              Array.from({ length: 6 }, (_, index) => (
                <article className="product-card product-card-skeleton" key={`product-skeleton-${index}`} aria-hidden="true">
                  <span className="skeleton-block skeleton-product-image" />
                  <div className="product-info">
                    <span className="skeleton-block skeleton-product-brand" />
                    <span className="skeleton-block skeleton-product-name" />
                    <span className="skeleton-block skeleton-product-price" />
                  </div>
                </article>
              ))}

            {contentState === 'ready' && paginatedProducts.map((product) => (
              <article key={product.id} className="product-card">
                {product.discount && <span className="product-badge">- {product.discount}%</span>}

                <div className="product-image">
                  <Link to={`/san-pham/${product.slug}`} className="product-image-link" aria-label={`Xem chi tiết ${product.name}`}>
                    <img src={product.image} alt={product.name} loading="lazy" />
                  </Link>
                  <div className="product-hover-actions" aria-label="TÃ¹y chá»n sáº£n pháº©m">
                    <button
                      type="button"
                      className="product-action"
                      title="Thêm vào giỏ hàng"
                      aria-label="Thêm vào giỏ hàng"
                      onClick={() => handleAddToCart(product.id)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="9" cy="20" r="1.7" />
                        <circle cx="18" cy="20" r="1.7" />
                        <path d="M3 4h2l2.4 10.8a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`product-action${wishlistIds.includes(product.id) ? ' active' : ''}`}
                      title={wishlistIds.includes(product.id) ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                      aria-label={wishlistIds.includes(product.id) ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                      onClick={() => handleToggleWishlist(product)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="product-action"
                      title="Xem nhanh"
                      aria-label="Xem nhanh"
                      onClick={() => openQuickView(product)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="product-info">
                  <p className="product-brand">RED BEAN BEAUTY</p>
                  <Link to={`/san-pham/${product.slug}`} className="product-name-link">
                    <h3 className="product-name">{product.name}</h3>
                  </Link>
                  <div className="product-pricing">
                    <span className="product-price">{formatPrice(product.price)}</span>
                    {product.originalPrice && <span className="product-original">{formatPrice(product.originalPrice)}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {contentState === 'error' && (
            <div className="products-status products-error" role="alert">
              <strong>Không thể tải danh sách sản phẩm</strong>
              <p>Đã có lỗi xảy ra. Vui lòng thử tải lại dữ liệu.</p>
              <button type="button" onClick={() => setLoadVersion((version) => version + 1)}>Thử lại</button>
            </div>
          )}

          {contentState === 'ready' && filteredProducts.length === 0 && (
            <div className="products-empty">
              <p>Không tìm thấy sản phẩm trong danh mục này.</p>
            </div>
          )}

          {contentState === 'ready' && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProducts.length}
              pageSize={6}
              itemLabel="sản phẩm"
              onPageChange={setCurrentPage}
            />
          )}
        </section>
      </div>

      {selectedPromo && (
        <div className="promo-modal-overlay" role="presentation" onClick={closePromoModal}>
          <div
            className="promo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="promo-modal-close" aria-label="Đóng" onClick={closePromoModal}>
              ×
            </button>
            <h2 id="promo-modal-title">NHẬP MÃ: {selectedPromo.code}</h2>
            <div className="promo-modal-code">
              <span>Mã khuyến mãi:</span>
              <strong>{selectedPromo.code}</strong>
            </div>
            <div className="promo-modal-body">
              <p>Điều kiện:</p>
              <ul>
                {selectedPromo.conditions.map((condition) => (
                  <li key={condition}>- {condition}</li>
                ))}
              </ul>
            </div>
            <div className="promo-modal-actions">
              <button type="button" className="promo-modal-secondary" onClick={closePromoModal}>
                Đóng
              </button>
              <button
                type="button"
                className={`promo-modal-primary${copiedPromoCode === selectedPromo.code ? ' copied' : ''}`}
                onClick={() => copyPromoCode(selectedPromo.code)}
              >
                {copiedPromoCode === selectedPromo.code ? 'Đã sao chép' : 'Sao chép mã'}
              </button>
            </div>
          </div>
        </div>
      )}

      {quickViewProduct && (
        <div className="quick-view-overlay" role="presentation" onClick={closeQuickView}>
          <div
            className="quick-view-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-view-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="quick-view-close" aria-label="Đóng" onClick={closeQuickView}>
              ×
            </button>

            <div className="quick-view-gallery">
              <div className="quick-view-main-image">
                <img src={quickViewImage || quickViewProduct.image} alt={quickViewProduct.name} />
              </div>

              <div className="quick-view-thumbs">
                {quickViewGallery.map((image) => (
                  <button
                    type="button"
                    className={`quick-view-thumb${image === (quickViewImage || quickViewProduct.image) ? ' active' : ''}`}
                    key={image}
                    onClick={() => setQuickViewImage(image)}
                  >
                    <img src={image} alt={quickViewProduct.name} />
                  </button>
                ))}
              </div>
            </div>

            <div className="quick-view-info">
              <h2 id="quick-view-title">{quickViewProduct.name}</h2>
              <div className="quick-view-meta">
                <span>
                  Thương hiệu: <strong>Red Bean Beauty</strong>
                </span>
                <span className="quick-view-divider">|</span>
                <span>Mã sản phẩm: RBB-{quickViewProduct.id.padStart(3, '0')}</span>
              </div>

              <div className="quick-view-price">
                <strong>{formatPrice(quickViewProduct.price)}</strong>
                {quickViewProduct.originalPrice && <span>{formatPrice(quickViewProduct.originalPrice)}</span>}
              </div>

              <div className="quick-view-options">
                <p>Phân loại:</p>
                <div className="quick-view-option-list">
                  {quickViewProduct.tags.slice(0, 2).map((tag, index) => (
                    <button type="button" className={index === 0 ? 'active' : ''} key={tag}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <p className="quick-view-desc">{quickViewProduct.description}</p>

              <div className="quick-view-buy">
                <div className="quick-view-qty" aria-label="Số lượng">
                  <button type="button" onClick={() => setQuickViewQuantity((quantity) => Math.max(1, quantity - 1))}>
                    -
                  </button>
                  <span>{quickViewQuantity}</span>
                  <button type="button" onClick={() => setQuickViewQuantity((quantity) => quantity + 1)}>
                    +
                  </button>
                </div>
                <button type="button" className="quick-view-add" onClick={() => handleAddToCart(quickViewProduct.id, quickViewQuantity)}>
                  Thêm vào giỏ hàng
                </button>
              </div>

              <Link to={`/san-pham/${quickViewProduct.slug}`} className="quick-view-detail" onClick={closeQuickView}>
                Xem chi tiết sản phẩm
              </Link>
            </div>
          </div>
        </div>
      )}

      {wishlistToastOpen && (
        <div className="wishlist-toast" role="status" aria-live="polite">
          <button type="button" className="wishlist-toast-close" aria-label="Đóng thông báo" onClick={() => setWishlistToastOpen(false)}>
            ×
          </button>
          <strong>Tuyệt vời</strong>
          <p>
            Bạn vừa thêm 1 sản phẩm vào mục yêu thích thành công bấm{' '}
            <Link to="/yeu-thich" onClick={() => setWishlistToastOpen(false)}>
              vào đây
            </Link>{' '}
            để tới trang yêu thích
          </p>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
