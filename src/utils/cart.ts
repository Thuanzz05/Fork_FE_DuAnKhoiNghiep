import { api, getAccessToken } from '../services/api'
import { getCurrentUser } from './auth'

export interface CartItem {
  productId: string
  quantity: number
}

export interface CartToastDetail {
  productId: string
  quantity: number
}

let cartItems: CartItem[] = []
let cartScope = getCurrentUser()?.id ?? 'guest'

const ensureCartScope = () => {
  const nextScope = getCurrentUser()?.id ?? 'guest'
  if (nextScope !== cartScope) {
    cartScope = nextScope
    cartItems = []
  }
}

const emitCartUpdated = (items: CartItem[]) => {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent('cart-updated', {
      detail: items,
    }),
  )
}

const emitCartToast = (detail: CartToastDetail) => {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent('cart-toast', {
      detail,
    }),
  )
}

export const getCartItems = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  ensureCartScope()
  return cartItems.map((item) => ({ ...item }))
}

export const saveCartItems = (items: CartItem[]) => {
  if (typeof window === 'undefined') return items

  const normalizedItems = items
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      productId: item.productId,
      quantity: Math.max(1, Math.floor(item.quantity)),
    }))

  ensureCartScope()
  cartItems = normalizedItems
  emitCartUpdated(normalizedItems)
  return normalizedItems
}

type ApiCartItem = CartItem & { product?: unknown }
type ApiCartResponse = { items: ApiCartItem[] }

const syncApiItems = (items: ApiCartItem[]) => saveCartItems(items.map(({ productId, quantity }) => ({ productId, quantity })))
const syncApiItemsForUser = (items: ApiCartItem[], userId: string) => (
  getCurrentUser()?.id === userId ? syncApiItems(items) : getCartItems()
)

export const syncCartFromApi = async () => {
  if (!getAccessToken()) return getCartItems()
  const requestedUserId = getCurrentUser()?.id
  const remoteItems = (await api.get<ApiCartResponse>('/customers/me/cart')).items
  if (!requestedUserId || getCurrentUser()?.id !== requestedUserId) return getCartItems()
  return syncApiItems(remoteItems)
}

export const refreshCartScope = () => emitCartUpdated(getCartItems())

export const addCartItem = (productId: string, quantity = 1) => {
  const currentItems = getCartItems()
  const existingItem = currentItems.find((item) => item.productId === productId)
  const addedQuantity = Math.max(1, Math.floor(quantity))
  let nextItems: CartItem[]

  if (existingItem) {
    nextItems = currentItems.map((item) =>
      item.productId === productId ? { ...item, quantity: item.quantity + addedQuantity } : item,
    )
  } else {
    nextItems = [...currentItems, { productId, quantity: addedQuantity }]
  }

  const savedItems = saveCartItems(nextItems)
  emitCartToast({ productId, quantity: addedQuantity })
  const userId = getCurrentUser()?.id
  if (getAccessToken() && userId) {
    void api.post<ApiCartResponse>('/customers/me/cart/items', { productId, quantity: addedQuantity })
      .then((result) => syncApiItemsForUser(result.items, userId))
      .catch(() => undefined)
  }

  return savedItems
}

export const addCartItemAndSync = async (productId: string, quantity = 1) => {
  const currentItems = getCartItems()
  const existingItem = currentItems.find((item) => item.productId === productId)
  const addedQuantity = Math.max(1, Math.floor(quantity))
  const nextItems = existingItem
    ? currentItems.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + addedQuantity } : item)
    : [...currentItems, { productId, quantity: addedQuantity }]

  const savedItems = saveCartItems(nextItems)
  emitCartToast({ productId, quantity: addedQuantity })
  const userId = getCurrentUser()?.id
  if (!getAccessToken() || !userId) return savedItems

  const remoteItems = await api.post<ApiCartResponse>('/customers/me/cart/items', { productId, quantity: addedQuantity })
  return syncApiItemsForUser(remoteItems.items, userId)
}

export const updateCartItemQuantity = (productId: string, quantity: number) => {
  const items = saveCartItems(
    getCartItems().map((item) =>
      item.productId === productId ? { ...item, quantity: Math.max(1, Math.floor(quantity)) } : item,
    ),
  )
  const userId = getCurrentUser()?.id
  if (getAccessToken() && userId) {
    void api.patch<ApiCartResponse>(`/customers/me/cart/items/${productId}`, { quantity })
      .then((result) => syncApiItemsForUser(result.items, userId))
      .catch(() => undefined)
  }
  return items
}

export const removeCartItem = (productId: string) => {
  const items = saveCartItems(getCartItems().filter((item) => item.productId !== productId))
  const userId = getCurrentUser()?.id
  if (getAccessToken() && userId) {
    void api.delete<ApiCartResponse>(`/customers/me/cart/items/${productId}`)
      .then((result) => syncApiItemsForUser(result.items, userId))
      .catch(() => undefined)
  }
  return items
}

export const getCartCount = () => {
  return getCartItems().reduce((total, item) => total + item.quantity, 0)
}
