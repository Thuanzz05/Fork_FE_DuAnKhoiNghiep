import { getStoreSettings } from './storeSettings'
export type OrderStatus =
  | 'CHO_XAC_NHAN'
  | 'DA_XAC_NHAN'
  | 'DANG_DONG_GOI'
  | 'DANG_GIAO_HANG'
  | 'DA_GIAO_HANG'
  | 'DA_HUY'
  | 'TRA_HANG'

export type PaymentStatus = 'CHUA_THANH_TOAN' | 'DA_THANH_TOAN' | 'THAT_BAI' | 'DA_HOAN_TIEN'

export type PaymentMethod = 'COD' | 'CHUYEN_KHOAN' | 'MOMO' | 'VNPAY' | 'ZALOPAY'

export interface OrderItem {
  productId: string
  productName: string
  productImage: string
  price: number
  quantity: number
  weight: string
}

export interface Order {
  id: string
  orderCode: string
  userId: string
  recipientName: string
  phone: string
  shippingAddress: string
  customerNote?: string
  totalProductPrice: number
  discountAmount: number
  shippingFee: number
  totalPayment: number
  paymentMethod: PaymentMethod
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  createdAt: string
  cancelReason?: string
  isReviewed?: boolean
  items: OrderItem[]
}

let memoryOrders: Order[] = []

const emitOrdersUpdated = (orders: Order[]) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<Order[]>('orders-updated', {
      detail: orders,
    }),
  )
}

export const getOrders = (): Order[] => {
  if (typeof window === 'undefined') return []
  return memoryOrders.map((order) => ({ ...order, items: order.items.map((item) => ({ ...item })) }))
}

export const getUserOrders = (userId: string): Order[] => {
  return getOrders()
    .filter((order) => order.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const saveOrders = (orders: Order[]): Order[] => {
  memoryOrders = orders
  emitOrdersUpdated(orders)
  return orders
}

export const createOrder = (orderData: Omit<Order, 'id' | 'orderCode' | 'createdAt'>): Order => {
  const allOrders = getOrders()
  const orderCode = `${getStoreSettings().orderPrefix}-${Math.floor(100000 + Math.random() * 900000)}`
  const newOrder: Order = {
    ...orderData,
    id: `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderCode,
    createdAt: new Date().toISOString(),
  }

  saveOrders([...allOrders, newOrder])
  return newOrder
}

export const cancelOrder = (orderId: string, reason = 'Người dùng yêu cầu hủy'): boolean => {
  const allOrders = getOrders()
  let isUpdated = false
  const updatedOrders = allOrders.map((order) => {
    if (order.id === orderId && order.orderStatus === 'CHO_XAC_NHAN') {
      isUpdated = true
      return {
        ...order,
        orderStatus: 'DA_HUY' as const,
        cancelReason: reason,
      }
    }
    return order
  })

  if (isUpdated) {
    saveOrders(updatedOrders)
  }
  return isUpdated
}
