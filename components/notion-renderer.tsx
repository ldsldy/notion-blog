'use client'

import { Notion } from '@notionpresso/react'
import type { CSSProperties, ReactNode } from 'react'

type NotionPost = {
  title: string
  content: { blocks: any[] }
  image?: string
  tags?: string[]
}

type FallbackBlockProps = {
  type: string
  children?: ReactNode
  [key: string]: any
}

type CustomCalloutProps = {
  callout: {
    icon?: any | null
    color?: string
    rich_text?: any[]
  }
  children?: ReactNode
}

type CustomColumnProps = {
  column?: {
    width_ratio?: number
  }
  children?: ReactNode
}

function CalloutRichText({ items }: { items: any[] }) {
  return items.map((item, index) => {
    const annotations = item.annotations ?? {}
    const text =
      item.plain_text ??
      item.text?.content ??
      item.equation?.expression ??
      ''
    const href = item.href ?? item.text?.link?.url
    const colorClass =
      annotations.color && annotations.color !== 'default'
        ? `notion-${annotations.color}`
        : ''

    let content: ReactNode = text
    if (annotations.code) content = <code>{content}</code>
    if (annotations.bold) content = <strong>{content}</strong>
    if (annotations.italic) content = <em>{content}</em>
    if (annotations.underline) content = <u>{content}</u>
    if (annotations.strikethrough) content = <s>{content}</s>

    const span = (
      <span className={`notion-span ${colorClass}`.trim()}>{content}</span>
    )

    return href ? (
      <a
        key={`${text}-${index}`}
        href={href}
        className="notion-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {span}
      </a>
    ) : (
      <span key={`${text}-${index}`}>{span}</span>
    )
  })
}

function CalloutIcon({ icon }: { icon: any }) {
  if (icon?.type === 'emoji' && icon.emoji) {
    return <span aria-hidden="true">{icon.emoji}</span>
  }

  const imageUrl =
    icon?.external?.url ?? icon?.file?.url ?? icon?.custom_emoji?.url

  return imageUrl ? <img src={imageUrl} alt="" aria-hidden="true" /> : null
}

function CustomCallout({ callout, children }: CustomCalloutProps) {
  const icon = callout?.icon
  const richText = callout?.rich_text ?? []
  const color = callout?.color ?? 'default'

  return (
    <div
      className={`notion-block notion-callout notion-custom-callout notion-${color}`}
    >
      {icon ? (
        <div className="notion-custom-callout-icon">
          <CalloutIcon icon={icon} />
        </div>
      ) : null}
      <div className="notion-custom-callout-body">
        {richText.length > 0 ? (
          <div className="notion-custom-callout-text">
            <CalloutRichText items={richText} />
          </div>
        ) : null}
        {children ? (
          <div className="notion-custom-callout-children">{children}</div>
        ) : null}
      </div>
    </div>
  )
}

function CustomColumnList({ children }: { children?: ReactNode }) {
  return (
    <div className="notion-block notion-column-list notion-custom-column-list">
      {children}
    </div>
  )
}

function CustomColumn({ column, children }: CustomColumnProps) {
  const widthRatio = Number(column?.width_ratio)
  const ratio = Number.isFinite(widthRatio) && widthRatio > 0 ? widthRatio : 1
  const style = {
    '--notion-column-width-ratio': ratio,
    flexBasis: 0,
    flexGrow: ratio,
    flexShrink: 1,
    minWidth: 0,
  } as CSSProperties

  return (
    <div className="notion-column notion-custom-column" style={style}>
      {children}
    </div>
  )
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
    <Notion
      custom={{
        fallback: FallbackBlock,
        callout: CustomCallout,
        column_list: CustomColumnList,
        column: CustomColumn,
      }}
    >
      <Notion.Cover src={post.image} />
      <Notion.Body>
        <Notion.Title title={post.title} />
        <div className="notion-post-tags" aria-label="포스팅 태그">
          <span className="notion-post-tags-label">Tags</span>
          <div className="notion-post-tags-list">
            {(post.tags?.length ? post.tags : ['미분류']).map((tag) => (
              <span key={tag} className="notion-post-tag">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <Notion.Blocks blocks={post.content.blocks} />
      </Notion.Body>
    </Notion>
  )
}
