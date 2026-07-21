export type NewsArticle = {
  id: number
  slug?: string
  title: string
  excerpt: string
  image: string
  date: string
  lead: string
  body: Array<{
    heading?: string
    paragraphs: string[]
  }>
  author?: string
  category?: string
  views?: number
}

export const normalizeNewsImagePath = (value: string) => {
  const path = value.trim().replaceAll('\\', '/')
  return path.replace(/^\/?public\//i, '/')
}

export const normalizeNewsArticle = <T extends NewsArticle>(article: T): T => ({
  ...article,
  image: normalizeNewsImagePath(article.image),
})
