export interface Product {
  id: string
  slug: string
  name: string
  nameEn: string
  category: string
  categorySlug: string
  image: string
  price: number
  originalPrice?: number
  discount?: number
  weight: string
  origin: string
  description: string
  mainIngredients: string[]
  tags: string[]
  isCombo?: boolean
}

export const categories: Array<{ name: string; slug: string }> = []
export const products: Product[] = []

export function formatPrice(price: number): string {
  return price.toLocaleString('vi-VN') + 'đ'
}
