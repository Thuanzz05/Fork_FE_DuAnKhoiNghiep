import { useEffect, useState } from 'react'

import type { Product } from '../data/products'
import { api } from '../services/api'

export type CatalogCategory = { id?: number; name: string; slug: string }
export type CatalogPromotion = { code: string; title: string; description: string; conditions: string[] }

export type CatalogProduct = Product & {
  sku?: string
  gallery?: string[]
  stock?: number
  usageInstructions?: string
}

type CatalogResponse = {
  categories: CatalogCategory[]
  products: CatalogProduct[]
  promotions: CatalogPromotion[]
}

const emptyCatalog: CatalogResponse = {
  categories: [],
  products: [],
  promotions: [],
}

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogResponse>(emptyCatalog)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.get<CatalogResponse>('/products')
      .then((data) => {
        if (active) setCatalog(data)
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return { ...catalog, loading }
}
