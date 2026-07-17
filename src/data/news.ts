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
