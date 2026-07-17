import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products'
import type { Product } from '../data/products'
import { useCatalog } from '../hooks/useCatalog'
import { addCartItem } from '../utils/cart'
import { getWishlistIds, removeWishlistId, syncWishlistFromApi } from '../utils/wishlist'
import ProductQuickViewModal from '../components/ProductQuickViewModal'
import './WishlistPage.css'

function WishlistPage() {
  const { products } = useCatalog()
  const [wishlistIds, setWishlistIds] = useState(() => getWishlistIds())
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  useEffect(() => {
    void syncWishlistFromApi().then(setWishlistIds).catch(() => undefined)
    const syncWishlist = () => setWishlistIds(getWishlistIds())
    const handleWishlistUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string[]>
      setWishlistIds(customEvent.detail || getWishlistIds())
    }

    window.addEventListener('storage', syncWishlist)
    window.addEventListener('wishlist-updated', handleWishlistUpdated)

    return () => {
      window.removeEventListener('storage', syncWishlist)
      window.removeEventListener('wishlist-updated', handleWishlistUpdated)
    }
  }, [])

  const wishlistProducts = useMemo(() => {
    return wishlistIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is (typeof products)[number] => Boolean(product))
  }, [products, wishlistIds])

  const handleRemove = (productId: string) => {
    setWishlistIds(removeWishlistId(productId))
  }

  const openQuickView = (product: Product) => {
    setQuickViewProduct(product)
  }

  const closeQuickView = () => setQuickViewProduct(null)

  const handleAddToCart = (productId: string) => {
    addCartItem(productId)
  }

  return (
    <main className="wishlist-page">
      <section className="wishlist-hero">
        <h1>Danh sách yêu thích của tôi</h1>
      </section>

      <section className="wishlist-container">
        {wishlistProducts.length > 0 ? (
          <div className="wishlist-grid">
            {wishlistProducts.map((product) => (
              <article className="wishlist-card" key={product.id}>
                {product.discount && <span className="wishlist-badge">- {product.discount}%</span>}

                <div className="wishlist-image-wrap">
                  <Link to={`/san-pham/${product.slug}`} className="wishlist-image">
                    <img src={product.image} alt={product.name} loading="lazy" />
                  </Link>

                  <div className="wishlist-hover-actions" aria-label="Tùy chọn sản phẩm yêu thích">
                    <button
                      type="button"
                      className="wishlist-action"
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
                      className="wishlist-action active"
                      title="Bỏ yêu thích"
                      aria-label={`Bỏ yêu thích ${product.name}`}
                      onClick={() => handleRemove(product.id)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="wishlist-action"
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

                <div className="wishlist-info">
                  <p>RED BEAN BEAUTY</p>
                  <Link to={`/san-pham/${product.slug}`} className="wishlist-name">
                    {product.name}
                  </Link>

                  <div className="wishlist-price">
                    <strong>{formatPrice(product.price)}</strong>
                    {product.originalPrice && <span>{formatPrice(product.originalPrice)}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="wishlist-empty">
            <h2>Danh sách yêu thích đang trống</h2>
            <p>Bạn có thể bấm vào biểu tượng trái tim ở sản phẩm để lưu lại món muốn xem sau.</p>
            <Link to="/san-pham">Xem sản phẩm</Link>
          </div>
        )}
      </section>

      {quickViewProduct && <ProductQuickViewModal product={quickViewProduct} onClose={closeQuickView} />}
    </main>
  )
}

export default WishlistPage
