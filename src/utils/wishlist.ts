import { getCurrentUser } from './auth'
import { api, getAccessToken } from '../services/api'

let wishlistIds: string[] = []
let wishlistScope = getCurrentUser()?.id ?? 'guest'

const ensureWishlistScope = () => {
  const nextScope = getCurrentUser()?.id ?? 'guest'
  if (nextScope !== wishlistScope) {
    wishlistScope = nextScope
    wishlistIds = []
  }
}

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
  ensureWishlistScope()
  return [...wishlistIds]
}

export const saveWishlistIds = (ids: string[]) => {
  if (typeof window === 'undefined') return ids

  const uniqueIds = Array.from(new Set(ids))
  ensureWishlistScope()
  wishlistIds = uniqueIds
  emitWishlistUpdated(uniqueIds)
  return uniqueIds
}

type WishlistProduct = { id: string }

const syncApiWishlist = (products: WishlistProduct[]) => saveWishlistIds(products.map((product) => product.id))
const syncApiWishlistForUser = (products: WishlistProduct[], userId: string) => (
  getCurrentUser()?.id === userId ? syncApiWishlist(products) : getWishlistIds()
)

export const syncWishlistFromApi = async () => {
  if (!getAccessToken()) return getWishlistIds()
  const requestedUserId = getCurrentUser()?.id
  const products = await api.get<WishlistProduct[]>('/customers/me/wishlist')
  if (!requestedUserId || getCurrentUser()?.id !== requestedUserId) return getWishlistIds()
  return syncApiWishlist(products)
}

export const refreshWishlistScope = () => emitWishlistUpdated(getWishlistIds())

export const toggleWishlistId = (productId: string) => {
  const currentIds = getWishlistIds()
  const isRemoving = currentIds.includes(productId)
  const nextIds = currentIds.includes(productId)
    ? currentIds.filter((id) => id !== productId)
    : [...currentIds, productId]

  const ids = saveWishlistIds(nextIds)
  const userId = getCurrentUser()?.id
  if (getAccessToken() && userId) {
    const request = isRemoving
      ? api.delete<WishlistProduct[]>(`/customers/me/wishlist/items/${productId}`)
      : api.post<WishlistProduct[]>('/customers/me/wishlist/items', { productId })
    void request.then((products) => syncApiWishlistForUser(products, userId)).catch(() => undefined)
  }
  return ids
}

export const removeWishlistId = (productId: string) => {
  const ids = saveWishlistIds(getWishlistIds().filter((id) => id !== productId))
  const userId = getCurrentUser()?.id
  if (getAccessToken() && userId) {
    void api.delete<WishlistProduct[]>(`/customers/me/wishlist/items/${productId}`)
      .then((products) => syncApiWishlistForUser(products, userId))
      .catch(() => undefined)
  }
  return ids
}
