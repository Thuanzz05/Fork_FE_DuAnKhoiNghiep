import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { useCatalog } from '../hooks/useCatalog'
import { getCartItems, removeCartItem, syncCartFromApi, updateCartItemQuantity } from '../utils/cart'
import { getCurrentUser } from '../utils/auth'
import './CartPage.css'

function CartPage() {
  const { products } = useCatalog()
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState(() => getCartItems())
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() =>
    getCartItems().map((item) => item.productId)
  )

  useEffect(() => {
    // Nếu có sản phẩm bị xóa khỏi giỏ hàng, bỏ chọn sản phẩm đó
    setSelectedProductIds((prev) => {
      const cartIds = cartItems.map((item) => item.productId)
      return prev.filter((id) => cartIds.includes(id))
    })
  }, [cartItems])

  useEffect(() => {
    void syncCartFromApi().then(setCartItems).catch(() => undefined)
    const syncCart = () => setCartItems(getCartItems())
    const handleCartUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ReturnType<typeof getCartItems>>
      setCartItems(customEvent.detail || getCartItems())
    }

    window.addEventListener('storage', syncCart)
    window.addEventListener('cart-updated', handleCartUpdated)

    return () => {
      window.removeEventListener('storage', syncCart)
      window.removeEventListener('cart-updated', handleCartUpdated)
    }
  }, [])

  const cartProducts = useMemo(() => {
    return cartItems
      .map((item) => {
        const product = products.find((currentProduct) => currentProduct.id === item.productId)
        return product ? { product, quantity: item.quantity } : null
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  }, [cartItems, products])

  const selectedProducts = useMemo(() => {
    return cartProducts.filter(({ product }) => selectedProductIds.includes(product.id))
  }, [cartProducts, selectedProductIds])

  const totalPrice = selectedProducts.reduce((total, item) => total + item.product.price * item.quantity, 0)

  const handleQuantityChange = (productId: string, quantity: number) => {
    setCartItems(updateCartItemQuantity(productId, quantity))
  }

  const handleRemove = (productId: string) => {
    setCartItems(removeCartItem(productId))
  }

  const handleToggleSelect = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const isAllSelected = cartProducts.length > 0 && selectedProductIds.length === cartProducts.length

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProductIds([])
    } else {
      setSelectedProductIds(cartProducts.map((p) => p.product.id))
    }
  }

  const handleCheckout = () => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/tai-khoan?che-do=dang-nhap')
      return
    }

    if (selectedProductIds.length === 0) return

    navigate('/thanh-toan', { state: { selectedIds: selectedProductIds } })
  }

  return (
    <main className="cart-page">
      <div className="cart-breadcrumb">
        <div className="cart-container">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <span>Giỏ hàng</span>
        </div>
      </div>

      <section className="cart-container cart-content">
        <h1>Giỏ hàng của bạn</h1>

        {cartProducts.length > 0 ? (
          <>
            <div className="cart-table">
              <div className="cart-table-head">
                <div className="cart-head-checkbox">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    aria-label="Chọn tất cả sản phẩm"
                  />
                </div>
                <span>Thông tin sản phẩm</span>
                <span>Đơn giá</span>
                <span>Số lượng</span>
                <span>Thành tiền</span>
                <span>Thao tác</span>
              </div>

              {cartProducts.map(({ product, quantity }) => {
                const isSelected = selectedProductIds.includes(product.id)
                return (
                  <div className={`cart-row${isSelected ? ' selected' : ''}`} key={product.id}>
                    <div className="cart-row-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(product.id)}
                        aria-label={`Chọn sản phẩm ${product.name}`}
                      />
                    </div>
                    <div className="cart-product">
                      <Link to={`/san-pham/${product.slug}`} className="cart-product-image">
                        <img src={product.image} alt={product.name} />
                      </Link>
                      <div>
                        <Link to={`/san-pham/${product.slug}`} className="cart-product-name">
                          {product.name}
                        </Link>
                      </div>
                    </div>

                    <div className="cart-price">{formatPrice(product.price)}</div>

                    <div className="cart-qty">
                      <button type="button" onClick={() => handleQuantityChange(product.id, quantity - 1)}>
                        -
                      </button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => handleQuantityChange(product.id, quantity + 1)}>
                        +
                      </button>
                    </div>

                    <div className="cart-line-total">{formatPrice(product.price * quantity)}</div>

                    <div className="cart-action-cell">
                      <button type="button" className="cart-remove" onClick={() => handleRemove(product.id)}>
                        Xóa
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="cart-summary">
              <div className="cart-total">
                <span>Tổng tiền:</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>
              <button
                type="button"
                className="cart-checkout"
                onClick={handleCheckout}
                disabled={selectedProductIds.length === 0}
              >
                Thanh toán
              </button>
            </div>
          </>
        ) : (
          <div className="cart-empty">
            <h2>Giỏ hàng đang trống</h2>
            <p>Bạn có thể thêm sản phẩm vào giỏ từ trang sản phẩm hoặc cửa sổ xem nhanh.</p>
            <Link to="/san-pham">Tiếp tục mua hàng</Link>
          </div>
        )}
      </section>
    </main>
  )
}

export default CartPage
