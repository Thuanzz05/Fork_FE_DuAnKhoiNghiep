import { api, getAccessToken } from '../services/api'

export interface CartItem {
  productId: string
  quantity: number
}

export interface CartToastDetail {
  productId: string
  quantity: number
}

export const CART_STORAGE_KEY = 'red-bean-beauty-cart'

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

  try {
    const rawValue = window.localStorage.getItem(CART_STORAGE_KEY)
    const parsedValue = rawValue ? JSON.parse(rawValue) : []

    if (!Array.isArray(parsedValue)) return []

    return parsedValue
      .filter((item): item is CartItem => {
        return typeof item?.productId === 'string' && Number.isFinite(item?.quantity)
      })
      .map((item) => ({
        productId: item.productId,
        quantity: Math.max(1, Math.floor(item.quantity)),
      }))
  } catch {
    return []
  }
}

export const saveCartItems = (items: CartItem[]) => {
  if (typeof window === 'undefined') return items

  const normalizedItems = items
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      productId: item.productId,
      quantity: Math.max(1, Math.floor(item.quantity)),
    }))

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedItems))
  emitCartUpdated(normalizedItems)
  return normalizedItems
}

type ApiCartItem = CartItem & { product?: unknown }

const syncApiItems = (items: ApiCartItem[]) => saveCartItems(items.map(({ productId, quantity }) => ({ productId, quantity })))

export const syncCartFromApi = async () => {
  if (!getAccessToken()) return getCartItems()
  const localItems = getCartItems()
  let remoteItems = await api.get<ApiCartItem[]>('/customers/me/cart')
  for (const localItem of localItems) {
    const remoteItem = remoteItems.find((item) => item.productId === localItem.productId)
    if (!remoteItem) {
      remoteItems = await api.post<ApiCartItem[]>('/customers/me/cart/items', localItem)
    } else if (localItem.quantity > remoteItem.quantity) {
      remoteItems = await api.patch<ApiCartItem[]>(`/customers/me/cart/items/${localItem.productId}`, { quantity: localItem.quantity })
    }
  }
  return syncApiItems(remoteItems)
}

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
  if (getAccessToken()) {
    void api.post<ApiCartItem[]>('/customers/me/cart/items', { productId, quantity: addedQuantity })
      .then(syncApiItems)
      .catch(() => undefined)
  }

  return savedItems
}

export const updateCartItemQuantity = (productId: string, quantity: number) => {
  const items = saveCartItems(
    getCartItems().map((item) =>
      item.productId === productId ? { ...item, quantity: Math.max(1, Math.floor(quantity)) } : item,
    ),
  )
  if (getAccessToken()) {
    void api.patch<ApiCartItem[]>(`/customers/me/cart/items/${productId}`, { quantity })
      .then(syncApiItems)
      .catch(() => undefined)
  }
  return items
}

export const removeCartItem = (productId: string) => {
  const items = saveCartItems(getCartItems().filter((item) => item.productId !== productId))
  if (getAccessToken()) {
    void api.delete<ApiCartItem[]>(`/customers/me/cart/items/${productId}`)
      .then(syncApiItems)
      .catch(() => undefined)
  }
  return items
}

export const getCartCount = () => {
  return getCartItems().reduce((total, item) => total + item.quantity, 0)
}
