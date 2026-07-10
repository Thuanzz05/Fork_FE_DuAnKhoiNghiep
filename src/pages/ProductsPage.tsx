import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { categories, formatPrice, products } from '../data/products'
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

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategorySlug = searchParams.get('danh-muc') || 'tat-ca'
  const [sortBy, setSortBy] = useState('default')
  const [selectedPromo, setSelectedPromo] = useState<(typeof promoCodes)[number] | null>(null)

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

  const handleCategoryChange = (slug: string) => {
    if (slug === 'tat-ca') {
      setSearchParams({})
    } else {
      setSearchParams({ 'danh-muc': slug })
    }
  }

  const closePromoModal = () => setSelectedPromo(null)

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
                <button type="button" className="promo-copy">
                  Sao chép mã
                </button>
                <button type="button" className="promo-cond" onClick={() => setSelectedPromo(promo)}>
                  Điều kiện
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="products-container products-layout">
        <aside className="products-sidebar">
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

          <div className="sidebar-section">
            <h3 className="sidebar-title">
              Thành phần chính
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </h3>
            <ul className="sidebar-list">
              {['Đậu đỏ', 'Cám gạo', 'Hoa cúc La Mã', 'Nước hoa hồng', 'Hyaluronic Acid', 'Niacinamide'].map((item) => (
                <li key={item}>
                  <label className="sidebar-filter">
                    <span className="filter-check" />
                    {item}
                  </label>
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
            {filteredProducts.map((product) => (
              <Link key={product.id} to={`/san-pham/${product.slug}`} className="product-card">
                {product.discount && <span className="product-badge">- {product.discount}%</span>}

                <div className="product-image">
                  <img src={product.image} alt={product.name} loading="lazy" />
                </div>

                <div className="product-tags">
                  {product.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="product-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="product-info">
                  <p className="product-brand">RED BEAN BEAUTY</p>
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-pricing">
                    <span className="product-price">{formatPrice(product.price)}</span>
                    {product.originalPrice && <span className="product-original">{formatPrice(product.originalPrice)}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="products-empty">
              <p>Không tìm thấy sản phẩm trong danh mục này.</p>
            </div>
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
              <button type="button" className="promo-modal-primary">
                Sao chép mã
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
