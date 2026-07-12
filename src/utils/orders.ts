
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

const ORDERS_STORAGE_KEY = 'red-bean-beauty-orders'

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
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Order[]) : []
  } catch {
    return []
  }
}

export const getUserOrders = (userId: string): Order[] => {
  return getOrders()
    .filter((order) => order.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const saveOrders = (orders: Order[]): Order[] => {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
  emitOrdersUpdated(orders)
  return orders
}

export const createOrder = (orderData: Omit<Order, 'id' | 'orderCode' | 'createdAt'>): Order => {
  const allOrders = getOrders()
  const orderCode = `RBB-${Math.floor(100000 + Math.random() * 900000)}`
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

export const seedMockOrders = (userId: string) => {
  const currentOrders = getOrders()
  // Check if this user already has orders
  const userHasOrders = currentOrders.some((order) => order.userId === userId)
  if (userHasOrders) return

  const mockOrders: Order[] = [
    {
      id: `order-mock-1`,
      orderCode: 'RBB-948123',
      userId,
      recipientName: 'Lê Văn Quang',
      phone: '0987654321',
      shippingAddress: 'Số 15, Đường Trần Hưng Đạo, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      customerNote: 'Giao giờ hành chính giúp em ạ.',
      totalProductPrice: 440000,
      discountAmount: 0,
      shippingFee: 30000,
      totalPayment: 470000,
      paymentMethod: 'COD',
      orderStatus: 'CHO_XAC_NHAN',
      paymentStatus: 'CHUA_THANH_TOAN',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      items: [
        {
          productId: '2',
          productName: 'Sữa rửa mặt tạo bọt đậu đỏ 150g',
          productImage: '/images/products/sua-rua-mat-tao-bot3.jpg',
          price: 220000,
          quantity: 2,
          weight: '150g',
        },
      ],
    },
    {
      id: `order-mock-2`,
      orderCode: 'RBB-837128',
      userId,
      recipientName: 'Lê Văn Quang',
      phone: '0987654321',
      shippingAddress: 'Số 15, Đường Trần Hưng Đạo, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      totalProductPrice: 670000,
      discountAmount: 50000,
      shippingFee: 0,
      totalPayment: 620000,
      paymentMethod: 'MOMO',
      orderStatus: 'DANG_GIAO_HANG',
      paymentStatus: 'DA_THANH_TOAN',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      items: [
        {
          productId: '1',
          productName: 'Combo chăm sóc da toàn diện đậu đỏ 3 món 150g',
          productImage: '/images/products/combo-3mon6.jpg',
          price: 450000,
          quantity: 1,
          weight: '150g x 3',
        },
        {
          productId: '4',
          productName: 'Toner dưỡng da đậu đỏ',
          productImage: '/images/products/toner-duong-da4.jpg',
          price: 220000,
          quantity: 1,
          weight: '150g',
        },
      ],
    },
    {
      id: `order-mock-3`,
      orderCode: 'RBB-129482',
      userId,
      recipientName: 'Lê Văn Quang',
      phone: '0987654321',
      shippingAddress: 'Số 15, Đường Trần Hưng Đạo, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      totalProductPrice: 250000,
      discountAmount: 0,
      shippingFee: 30000,
      totalPayment: 280000,
      paymentMethod: 'CHUYEN_KHOAN',
      orderStatus: 'DA_GIAO_HANG',
      paymentStatus: 'DA_THANH_TOAN',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      items: [
        {
          productId: '3',
          productName: 'Mặt nạ tẩy tế bào chết đậu đỏ 150g',
          productImage: '/images/products/mat-na-tay-te-bao-chet6.jpg',
          price: 250000,
          quantity: 1,
          weight: '150g',
        },
      ],
    },
    {
      id: `order-mock-4`,
      orderCode: 'RBB-581938',
      userId,
      recipientName: 'Lê Văn Quang',
      phone: '0987654321',
      shippingAddress: 'Số 15, Đường Trần Hưng Đạo, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      totalProductPrice: 220000,
      discountAmount: 0,
      shippingFee: 30000,
      totalPayment: 250000,
      paymentMethod: 'COD',
      orderStatus: 'DA_HUY',
      paymentStatus: 'CHUA_THANH_TOAN',
      cancelReason: 'Thay đổi địa chỉ giao hàng',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      items: [
        {
          productId: '4',
          productName: 'Toner dưỡng da đậu đỏ',
          productImage: '/images/products/toner-duong-da4.jpg',
          price: 220000,
          quantity: 1,
          weight: '150g',
        },
      ],
    },
  ]

  saveOrders([...currentOrders, ...mockOrders])
}
