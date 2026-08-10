export type Post = {
  title: string
  slug: string
  content: { blocks: any[] }
  date: string
  description: string
  image?: string
  tags?: string[]
  notionPageId?: string
}
