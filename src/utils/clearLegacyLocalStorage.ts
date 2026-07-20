const exactLegacyKeys = new Set([
  'red-bean-beauty-auth-session',
  'red-bean-beauty-auth-users',
  'red-bean-beauty-cart',
  'red-bean-beauty-wishlist',
  'red-bean-beauty-orders',
  'red-bean-beauty-reviews',
  'rubeanora-store-settings',
  'rubeanora-access-token',
])

const legacyPrefixes = ['red-bean-beauty-cart:', 'red-bean-beauty-wishlist:']

Object.keys(window.localStorage)
  .filter((key) => exactLegacyKeys.has(key) || legacyPrefixes.some((prefix) => key.startsWith(prefix)))
  .forEach((key) => window.localStorage.removeItem(key))
