import { getOrders, saveOrders } from './orders'

export type ReviewModerationStatus = 'pending' | 'approved' | 'hidden'

export interface ProductReview {
  id: string
  orderId: string
  productId: string
  userId: string
  userName: string
  rating: number // 1-5
  comment: string
  createdAt: string
  status?: ReviewModerationStatus
  reply?: string
  replyAt?: string
  verifiedPurchase?: boolean
}

const REVIEWS_STORAGE_KEY = 'red-bean-beauty-reviews'

export const getReviews = (): ProductReview[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ProductReview[]) : []
  } catch {
    return []
  }
}

export const saveReviews = (reviews: ProductReview[]): void => {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews))
  window.dispatchEvent(new CustomEvent('reviews-updated'))
}

export const getProductReviews = (productId: string): ProductReview[] => {
  return getReviews().filter((r) => r.productId === productId)
}

export const getOrderReviews = (orderId: string): ProductReview[] => {
  return getReviews().filter((r) => r.orderId === orderId)
}

export const submitOrderReviews = (
  orderId: string,
  userId: string,
  userName: string,
  itemsReviews: { productId: string; rating: number; comment: string }[]
): void => {
  const currentReviews = getReviews()
  const newReviews: ProductReview[] = itemsReviews.map((item) => ({
    id: `rev-${Math.floor(100000 + Math.random() * 900000)}`,
    orderId,
    productId: item.productId,
    userId,
    userName,
    rating: item.rating,
    comment: item.comment,
    createdAt: new Date().toISOString(),
    status: 'pending',
    verifiedPurchase: true,
  }))

  saveReviews([...currentReviews, ...newReviews])

  // Update order flag
  const orders = getOrders()
  const updatedOrders = orders.map((order) => {
    if (order.id === orderId) {
      return { ...order, isReviewed: true }
    }
    return order
  })
  saveOrders(updatedOrders)
}
