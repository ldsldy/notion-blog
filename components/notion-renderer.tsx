'use client'

import { Notion } from '@notionpresso/react'
import { useState, type CSSProperties, type ReactNode } from 'react'

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

type CustomHeading2Props = {
  id?: string
  heading_2: {
    color?: string
    is_toggleable?: boolean
    rich_text?: any[]
  }
  children?: ReactNode
}

type CustomHeading4Props = {
  heading_4: {
    color?: string
    is_toggleable?: boolean
    rich_text?: any[]
  }
  children?: ReactNode
}

type CustomTableProps = {
  table: {
    table_width?: number
    has_column_header?: boolean
    has_row_header?: boolean
  }
  children?: ReactNode
}

type CustomTableRowProps = {
  table_row: {
    cells?: any[][]
  }
}

type TableOfContentsItem = {
  id: string
  text: string
}

function NotionRichText({ items }: { items: any[] }) {
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
            <NotionRichText items={richText} />
          </div>
        ) : null}
        {children ? (
          <div className="notion-custom-callout-children">{children}</div>
        ) : null}
      </div>
    </div>
  )
}

function headingAnchorId(id?: string) {
  return `section-${id ?? 'untitled'}`
}

function CustomHeading2({ id, heading_2, children }: CustomHeading2Props) {
  const [isOpen, setIsOpen] = useState(false)
  const color = heading_2?.color ?? 'default'
  const richText = heading_2?.rich_text ?? []
  const isToggleable = Boolean(heading_2?.is_toggleable)

  return (
    <div
      id={headingAnchorId(id)}
      className={`notion-block notion-toggle notion-h2 notion-${color} notion-toc-heading ${
        isOpen ? 'notion-toggle-open' : ''
      }`}
    >
      {isToggleable ? (
        <>
          <div className="notion-toggle-content">
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="notion-toggle-button"
              aria-expanded={isOpen}
              aria-label={isOpen ? '소제목 접기' : '소제목 펼치기'}
            >
              <span
                className={`notion-toggle-button-arrow ${
                  isOpen ? 'notion-toggle-button-arrow-opened' : ''
                }`}
              />
            </button>
            <h2 className="notion-h-content notion-h2-content">
              <NotionRichText items={richText} />
            </h2>
          </div>
          {children}
        </>
      ) : (
        <h2 className="notion-h-content notion-h2-content">
          <NotionRichText items={richText} />
        </h2>
      )}
    </div>
  )
}

function CustomHeading4({ heading_4, children }: CustomHeading4Props) {
  const [isOpen, setIsOpen] = useState(false)
  const color = heading_4?.color ?? 'default'
  const richText = heading_4?.rich_text ?? []
  const isToggleable = Boolean(heading_4?.is_toggleable)

  return (
    <div
      className={`notion-block notion-toggle notion-h4 notion-${color} ${
        isOpen ? 'notion-toggle-open' : ''
      }`}
    >
      {isToggleable ? (
        <>
          <div className="notion-toggle-content">
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="notion-toggle-button"
              aria-expanded={isOpen}
              aria-label={isOpen ? '제목 접기' : '제목 펼치기'}
            >
              <span
                className={`notion-toggle-button-arrow ${
                  isOpen ? 'notion-toggle-button-arrow-opened' : ''
                }`}
              />
            </button>
            <h4 className="notion-h-content notion-h4-content">
              <NotionRichText items={richText} />
            </h4>
          </div>
          {children}
        </>
      ) : (
        <h4 className="notion-h-content notion-h4-content">
          <NotionRichText items={richText} />
        </h4>
      )}
    </div>
  )
}

function collectTableOfContents(blocks: any[]): TableOfContentsItem[] {
  return blocks.flatMap((block) => {
    const current =
      block.type === 'heading_2'
        ? [
            {
              id: headingAnchorId(block.id),
              text: (block.heading_2?.rich_text ?? [])
                .map(
                  (item: any) =>
                    item?.plain_text ?? item?.text?.content ?? '',
                )
                .join('')
                .trim(),
            },
          ].filter((item) => item.text)
        : []

    return [
      ...current,
      ...collectTableOfContents(Array.isArray(block.blocks) ? block.blocks : []),
    ]
  })
}

function PostTableOfContents({ items }: { items: TableOfContentsItem[] }) {
  if (items.length === 0) return null

  return (
    <aside className="notion-post-toc" aria-label="포스팅 목차">
      <nav>
        <p className="notion-post-toc-title">목차</p>
        <ol>
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.text}</a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
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

function CustomTable({ table, children }: CustomTableProps) {
  const hasColumnHeader = Boolean(table?.has_column_header)
  const hasRowHeader = Boolean(table?.has_row_header)
  const columnCount = Math.max(Number(table?.table_width) || 1, 1)
  const style = {
    '--notion-table-min-width': `${Math.max(columnCount * 17, 42)}rem`,
  } as CSSProperties

  return (
    <div
      className="notion-block notion-responsive-table"
      role="region"
      aria-label="표"
      tabIndex={0}
      style={style}
    >
      <table
        className={`notion-table notion-table-content ${
          hasColumnHeader ? 'notion-has-column-header' : ''
        } ${hasRowHeader ? 'notion-has-row-header' : ''}`.trim()}
      >
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function CustomTableRow({ table_row }: CustomTableRowProps) {
  const cells = table_row?.cells ?? []

  return (
    <tr className="notion-table-row">
      {cells.map((cell, index) => (
        <td key={index}>
          <NotionRichText items={cell ?? []} />
        </td>
      ))}
    </tr>
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
  const tableOfContents = collectTableOfContents(post.content.blocks)

  return (
    <Notion
      custom={{
        fallback: FallbackBlock,
        callout: CustomCallout,
        column_list: CustomColumnList,
        column: CustomColumn,
        table: CustomTable,
        table_row: CustomTableRow,
        heading_2: CustomHeading2,
        heading_4: CustomHeading4,
      }}
    >
      <Notion.Cover src={post.image} />
      <div className="notion-content-shell">
        <PostTableOfContents items={tableOfContents} />
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
      </div>
    </Notion>
  )
}
