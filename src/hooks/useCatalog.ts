import { useEffect, useState } from 'react'

import { categories as fallbackCategories, products as fallbackProducts } from '../data/products'
import type { Product } from '../data/products'
import { api } from '../services/api'

export type CatalogCategory = { id?: number; name: string; slug: string }
export type CatalogProduct = Product & {
  sku?: string
  gallery?: string[]
  stock?: number
  usageInstructions?: string
}

type CatalogResponse = {
  categories: CatalogCategory[]
  products: CatalogProduct[]
  promotions: Array<{ code: string; title: string; description: string; conditions: string[] }>
}

const fallback: CatalogResponse = {
  categories: fallbackCategories,
  products: fallbackProducts,
  promotions: [],
}

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogResponse>(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.get<CatalogResponse>('/products')
      .then((data) => {
        if (active && data.products?.length) setCatalog(data)
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return { ...catalog, loading }
}
