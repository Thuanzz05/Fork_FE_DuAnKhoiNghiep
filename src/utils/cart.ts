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

  return savedItems
}

export const updateCartItemQuantity = (productId: string, quantity: number) => {
  return saveCartItems(
    getCartItems().map((item) =>
      item.productId === productId ? { ...item, quantity: Math.max(1, Math.floor(quantity)) } : item,
    ),
  )
}

export const removeCartItem = (productId: string) => {
  return saveCartItems(getCartItems().filter((item) => item.productId !== productId))
}

export const getCartCount = () => {
  return getCartItems().reduce((total, item) => total + item.quantity, 0)
}
