import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products'
import type { Product } from '../data/products'
import { addCartItem } from '../utils/cart'
import './ProductQuickViewModal.css'

interface ProductQuickViewModalProps {
  product: Product & { gallery?: string[] }
  onClose: () => void
}

function ProductQuickViewModal({ product, onClose }: ProductQuickViewModalProps) {
  const [activeImage, setActiveImage] = useState(product.image)
  const [quantity, setQuantity] = useState(1)
  const gallery = product.gallery?.length ? product.gallery : [product.image]

  useEffect(() => {
    setActiveImage(product.image)
    setQuantity(1)
  }, [product])

  return (
    <div className="quick-view-overlay" role="presentation" onClick={onClose}>
      <div
        className="quick-view-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="quick-view-close" aria-label="Đóng" onClick={onClose}>
          ×
        </button>

        <div className="quick-view-gallery">
          <div className="quick-view-main-image">
            <img src={activeImage} alt={product.name} />
          </div>

          <div className="quick-view-thumbs">
            {gallery.map((image) => (
              <button
                type="button"
                className={`quick-view-thumb${image === activeImage ? ' active' : ''}`}
                key={image}
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt={product.name} />
              </button>
            ))}
          </div>
        </div>

        <div className="quick-view-info">
          <h2 id="quick-view-title">{product.name}</h2>
          <div className="quick-view-meta">
            <span>
              Thương hiệu: <strong>Red Bean Beauty</strong>
            </span>
            <span className="quick-view-divider">|</span>
            <span>Mã sản phẩm: RBB-{product.id.padStart(3, '0')}</span>
          </div>

          <div className="quick-view-price">
            <strong>{formatPrice(product.price)}</strong>
            {product.originalPrice && <span>{formatPrice(product.originalPrice)}</span>}
          </div>

          <div className="quick-view-options">
            <p>Phân loại:</p>
            <div className="quick-view-option-list">
              {product.tags.slice(0, 2).map((tag, index) => (
                <button type="button" className={index === 0 ? 'active' : ''} key={tag}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <p className="quick-view-desc">{product.description}</p>

          <div className="quick-view-buy">
            <div className="quick-view-qty" aria-label="Số lượng">
              <button type="button" onClick={() => setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1))}>
                -
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((currentQuantity) => currentQuantity + 1)}>
                +
              </button>
            </div>
            <button type="button" className="quick-view-add" disabled={(product.stock ?? 0) <= 0} onClick={() => addCartItem(product.id, quantity)}>
              {(product.stock ?? 0) <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
            </button>
          </div>

          <Link to={`/san-pham/${product.slug}`} className="quick-view-detail" onClick={onClose}>
            Xem chi tiết sản phẩm
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ProductQuickViewModal
