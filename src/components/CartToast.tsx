import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CartToastDetail } from '../utils/cart'
import './CartToast.css'

function CartToast() {
  const [toastDetail, setToastDetail] = useState<CartToastDetail | null>(null)

  useEffect(() => {
    const handleCartToast = (event: Event) => {
      const customEvent = event as CustomEvent<CartToastDetail>
      setToastDetail(customEvent.detail)
    }

    window.addEventListener('cart-toast', handleCartToast)

    return () => window.removeEventListener('cart-toast', handleCartToast)
  }, [])

  useEffect(() => {
    if (!toastDetail) return

    const timerId = window.setTimeout(() => {
      setToastDetail(null)
    }, 4200)

    return () => window.clearTimeout(timerId)
  }, [toastDetail])

  if (!toastDetail) return null

  return (
    <div className="cart-toast" role="status" aria-live="polite">
      <button type="button" className="cart-toast-close" aria-label="Đóng thông báo" onClick={() => setToastDetail(null)}>
        ×
      </button>
      <strong>Tuyệt vời</strong>
      <p>
        Bạn vừa thêm {toastDetail.quantity} sản phẩm vào giỏ hàng thành công bấm{' '}
        <Link to="/gio-hang" onClick={() => setToastDetail(null)}>
          vào đây
        </Link>{' '}
        để tới trang giỏ hàng
      </p>
    </div>
  )
}

export default CartToast
