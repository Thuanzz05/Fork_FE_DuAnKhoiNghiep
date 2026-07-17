export const WISHLIST_STORAGE_KEY = 'red-bean-beauty-wishlist'

const emitWishlistUpdated = (ids: string[]) => {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent('wishlist-updated', {
      detail: ids,
    }),
  )
}

export const getWishlistIds = () => {
  if (typeof window === 'undefined') return []

  try {
    const rawValue = window.localStorage.getItem(WISHLIST_STORAGE_KEY)
    const parsedValue = rawValue ? JSON.parse(rawValue) : []
    return Array.isArray(parsedValue) ? parsedValue.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export const saveWishlistIds = (ids: string[]) => {
  if (typeof window === 'undefined') return ids

  const uniqueIds = Array.from(new Set(ids))
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(uniqueIds))
  emitWishlistUpdated(uniqueIds)
  return uniqueIds
}

type WishlistProduct = { id: string }

const syncApiWishlist = (products: WishlistProduct[]) => saveWishlistIds(products.map((product) => product.id))

export const syncWishlistFromApi = async () => {
  if (!getAccessToken()) return getWishlistIds()
  const localIds = getWishlistIds()
  let products = await api.get<WishlistProduct[]>('/customers/me/wishlist')
  for (const productId of localIds.filter((id) => !products.some((product) => product.id === id))) {
    products = await api.post<WishlistProduct[]>('/customers/me/wishlist/items', { productId })
  }
  return syncApiWishlist(products)
}

export const toggleWishlistId = (productId: string) => {
  const currentIds = getWishlistIds()
  const isRemoving = currentIds.includes(productId)
  const nextIds = currentIds.includes(productId)
    ? currentIds.filter((id) => id !== productId)
    : [...currentIds, productId]

  const ids = saveWishlistIds(nextIds)
  if (getAccessToken()) {
    const request = isRemoving
      ? api.delete<WishlistProduct[]>(`/customers/me/wishlist/items/${productId}`)
      : api.post<WishlistProduct[]>('/customers/me/wishlist/items', { productId })
    void request.then(syncApiWishlist).catch(() => undefined)
  }
  return ids
}

export const removeWishlistId = (productId: string) => {
  const ids = saveWishlistIds(getWishlistIds().filter((id) => id !== productId))
  if (getAccessToken()) {
    void api.delete<WishlistProduct[]>(`/customers/me/wishlist/items/${productId}`)
      .then(syncApiWishlist)
      .catch(() => undefined)
  }
  return ids
}
import { api, getAccessToken } from '../services/api'
