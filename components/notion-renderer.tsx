'use client'

import { Notion } from '@notionpresso/react'
import type { ReactNode } from 'react'

type NotionPost = {
  title: string
  content: { blocks: any[] }
  image?: string
}

type FallbackBlockProps = {
  type: string
  children?: ReactNode
  [key: string]: any
}

function FallbackBlock({ type, children, ...block }: FallbackBlockProps) {
  const value = block[type] ?? {}
  const richText = value.rich_text ?? value.caption ?? []
  const text = Array.isArray(richText)
    ? richText
        .map((item) => item?.plain_text ?? item?.text?.content ?? '')
        .join('')
        .trim()
    : ''
  const title = value.title ?? ''
  const url = value.url ?? value.external?.url ?? value.file?.url
  const label = text || title || url

  if (!label && !children) return null

  return (
    <div className="notion-block my-4">
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      ) : label ? (
        <p>{label}</p>
      ) : null}
      {children}
    </div>
  )
}

export default function NotionRenderer({ post }: { post: NotionPost }) {
  return (
    <Notion custom={{ fallback: FallbackBlock }}>
      <Notion.Cover src={post.image} />
      <Notion.Body>
        <Notion.Title title={post.title} />
        <Notion.Blocks blocks={post.content.blocks} />
      </Notion.Body>
    </Notion>
  )
}
