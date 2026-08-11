import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const NOTION_API_URL = 'https://api.notion.com/v1'
const NOTION_VERSION = '2025-09-03'
const PUBLISHED_STATUS = 'Published'
const PROPERTY_NAMES = {
  title: 'Title',
  slug: 'Slug',
  status: 'Status',
  publishedAt: 'PublishedAt',
  description: 'Description',
  thumbnail: 'Thumbnail',
  tags: 'Tags',
}

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const notionDataDir = path.join(workspaceRoot, 'notion-data')
const publicNotionDir = path.join(workspaceRoot, 'public', 'notion-data')
const generatedPostsFile = path.join(workspaceRoot, 'content', 'notion-posts.generated.ts')
const manifestFile = path.join(notionDataDir, '.sync-manifest.json')

const notionToken = process.env.NOTION_TOKEN?.trim()
const databaseId = normalizeId(process.env.NOTION_DATABASE_ID)

if (!notionToken) {
  throw new Error('NOTION_TOKEN environment variable is required.')
}

if (!databaseId) {
  throw new Error('NOTION_DATABASE_ID environment variable is required.')
}

function normalizeId(value) {
  if (!value) return ''

  const compact = value.trim().replaceAll('-', '')
  if (!/^[0-9a-f]{32}$/i.test(compact)) {
    throw new Error('NOTION_DATABASE_ID must be a 32-character Notion ID.')
  }

  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20),
  ].join('-')
}

async function notionRequest(endpoint, options = {}) {
  const response = await fetch(`${NOTION_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${notionToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
      ...options.headers,
    },
  })

  const responseText = await response.text()
  let payload

  try {
    payload = responseText ? JSON.parse(responseText) : {}
  } catch {
    payload = { message: responseText }
  }

  if (!response.ok) {
    const message = payload.message || response.statusText
    throw new Error(`Notion API ${response.status}: ${message}`)
  }

  return payload
}

async function resolveDataSourceId() {
  const database = await notionRequest(`/databases/${databaseId}`)
  const dataSources = database.data_sources || []

  if (dataSources.length === 0) {
    throw new Error('The Notion database does not contain a data source.')
  }

  if (dataSources.length > 1) {
    throw new Error(
      'The Notion database contains multiple data sources. Use a database with one Blog Posts data source.',
    )
  }

  return dataSources[0].id
}

async function queryPublishedPages(dataSourceId) {
  const pages = []
  let startCursor

  do {
    const response = await notionRequest(`/data_sources/${dataSourceId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        sorts: [
          {
            property: PROPERTY_NAMES.publishedAt,
            direction: 'descending',
          },
        ],
        page_size: 100,
        ...(startCursor ? { start_cursor: startCursor } : {}),
      }),
    })

    pages.push(...response.results)
    startCursor = response.has_more ? response.next_cursor : undefined
  } while (startCursor)

  return pages.filter((page) => readStatus(page.properties?.[PROPERTY_NAMES.status]) === PUBLISHED_STATUS)
}

async function fetchBlocks(parentId) {
  const blocks = []
  let startCursor

  do {
    const query = new URLSearchParams({ page_size: '100' })
    if (startCursor) query.set('start_cursor', startCursor)

    const response = await notionRequest(`/blocks/${parentId}/children?${query}`)
    blocks.push(...response.results)
    startCursor = response.has_more ? response.next_cursor : undefined
  } while (startCursor)

  return Promise.all(
    blocks.map(async (block) => ({
      ...block,
      blocks: block.has_children ? await fetchBlocks(block.id) : [],
    })),
  )
}

function richTextValue(property) {
  const values = property?.title || property?.rich_text || []
  return values.map((value) => value.plain_text || value.text?.content || '').join('').trim()
}

function readStatus(property) {
  return property?.status?.name || property?.select?.name
}

function fileUrl(file) {
  if (file?.type === 'file') return file.file?.url
  if (file?.type === 'external') return file.external?.url
  return undefined
}

function pageCoverUrl(page) {
  if (page.cover?.type === 'file') return page.cover.file?.url
  if (page.cover?.type === 'external') return page.cover.external?.url
  return undefined
}

function validateAndReadProperties(page) {
  const properties = page.properties || {}
  const title = richTextValue(properties[PROPERTY_NAMES.title])
  const slug = richTextValue(properties[PROPERTY_NAMES.slug])
  const status = readStatus(properties[PROPERTY_NAMES.status])
  const publishedAt = properties[PROPERTY_NAMES.publishedAt]?.date?.start
  const description = richTextValue(properties[PROPERTY_NAMES.description])
  const thumbnailFiles = properties[PROPERTY_NAMES.thumbnail]?.files || []
  const thumbnailUrl = fileUrl(thumbnailFiles[0]) || pageCoverUrl(page)
  const tags = (properties[PROPERTY_NAMES.tags]?.multi_select || []).map((tag) => tag.name)

  const missing = []
  if (!title) missing.push(PROPERTY_NAMES.title)
  if (!slug) missing.push(PROPERTY_NAMES.slug)
  if (!publishedAt) missing.push(PROPERTY_NAMES.publishedAt)
  if (!description) missing.push(PROPERTY_NAMES.description)

  if (status !== PUBLISHED_STATUS) {
    throw new Error(`Page ${page.id} is not marked ${PUBLISHED_STATUS}.`)
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      `Page "${title || page.id}" has an invalid Slug "${slug}". Use lowercase letters, numbers, and hyphens.`,
    )
  }

  if (missing.length > 0) {
    throw new Error(`Page "${title || page.id}" is missing: ${missing.join(', ')}.`)
  }

  return {
    title,
    slug,
    date: publishedAt.slice(0, 10),
    description,
    thumbnailUrl,
    tags,
  }
}

const contentTypeExtensions = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/gif', '.gif'],
  ['image/webp', '.webp'],
  ['image/svg+xml', '.svg'],
])

function extensionFromUrl(url) {
  try {
    const extension = path.extname(new URL(url).pathname).toLowerCase()
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(extension)
      ? extension
      : undefined
  } catch {
    return undefined
  }
}

async function downloadImage(url, destinationWithoutExtension) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}): ${url}`)
  }

  const contentType = response.headers.get('content-type')?.split(';')[0].toLowerCase()
  const extension = contentTypeExtensions.get(contentType) || extensionFromUrl(url) || '.jpg'
  const destination = `${destinationWithoutExtension}${extension}`
  const buffer = Buffer.from(await response.arrayBuffer())

  await writeFile(destination, buffer)
  return destination
}

function imageBlockUrl(block) {
  if (block.type !== 'image') return undefined
  return fileUrl(block.image)
}

function setImageBlockUrl(block, url) {
  block.image = {
    caption: block.image?.caption || [],
    type: 'external',
    external: { url },
  }
}

const SUPPORTED_BLOCK_TYPES = new Set([
  'heading_1',
  'heading_2',
  'heading_3',
  'heading_4',
  'paragraph',
  'bulleted_list_item',
  'toggle',
  'equation',
  'numbered_list_item',
  'quote',
  'callout',
  'divider',
  'image',
  'video',
  'column',
  'column_list',
  'code',
  'to_do',
  'table',
  'table_row',
])

function fallbackRichText(content, url) {
  if (!content) return []

  return [
    {
      type: 'text',
      text: {
        content,
        link: url ? { url } : null,
      },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
      plain_text: content,
      href: url || null,
    },
  ]
}

function sanitizeBlocks(blocks) {
  return blocks.map((block) => {
    const children = sanitizeBlocks(block.blocks || [])

    if (SUPPORTED_BLOCK_TYPES.has(block.type)) {
      return { ...block, blocks: children }
    }

    const value = block[block.type] || {}
    const existingRichText = value.rich_text || value.caption || []
    const url = value.url || value.external?.url || value.file?.url
    const label = value.title || value.name || url || ''
    const richText = existingRichText.length
      ? existingRichText
      : fallbackRichText(label, url)

    console.warn(`Converted unsupported Notion block to paragraph: ${block.type}`)

    return {
      ...block,
      type: 'paragraph',
      paragraph: {
        rich_text: richText,
        color: 'default',
      },
      blocks: children,
    }
  })
}

async function localizeBlockImages(blocks, pageId, imageDirectory) {
  for (const block of blocks) {
    const sourceUrl = imageBlockUrl(block)

    if (sourceUrl) {
      const blockId = block.id.replaceAll('-', '')
      const destination = await downloadImage(
        sourceUrl,
        path.join(imageDirectory, `image-${blockId}`),
      )
      const publicUrl = `/notion-data/${pageId}/${path.basename(destination)}`
      setImageBlockUrl(block, publicUrl)
    }

    if (block.blocks?.length) {
      await localizeBlockImages(block.blocks, pageId, imageDirectory)
    }
  }
}

async function syncPage(page) {
  const metadata = validateAndReadProperties(page)
  const pageId = page.id
  const imageDirectory = path.join(publicNotionDir, pageId)

  await rm(imageDirectory, { recursive: true, force: true })
  await mkdir(imageDirectory, { recursive: true })

  const blocks = sanitizeBlocks(await fetchBlocks(pageId))
  await localizeBlockImages(blocks, pageId, imageDirectory)

  let image
  if (metadata.thumbnailUrl) {
    const thumbnailPath = await downloadImage(
      metadata.thumbnailUrl,
      path.join(imageDirectory, 'thumbnail'),
    )
    image = `/notion-data/${pageId}/${path.basename(thumbnailPath)}`
  }

  const content = { ...page, blocks }
  await writeFile(
    path.join(notionDataDir, `${pageId}.json`),
    `${JSON.stringify(content, null, 2)}\n`,
    'utf8',
  )

  return {
    notionPageId: pageId,
    title: metadata.title,
    slug: metadata.slug,
    date: metadata.date,
    description: metadata.description,
    image,
    tags: metadata.tags,
  }
}

function generatePostsSource(posts) {
  const imports = posts
    .map(
      (post, index) =>
        `import notionPost${index} from '../notion-data/${post.notionPageId}.json'`,
    )
    .join('\n')

  const entries = posts.map((post, index) => ({
    ...post,
    content: `__NOTION_CONTENT_${index}__`,
  }))

  let serialized = JSON.stringify(entries, null, 2)
  posts.forEach((_, index) => {
    serialized = serialized.replace(`"__NOTION_CONTENT_${index}__"`, `notionPost${index}`)
  })

  return `${imports}${imports ? '\n' : ''}import type { Post } from './post'

// This file is generated by \`npm run sync:notion\`. Do not edit it manually.
const notionPosts: Post[] = ${serialized}

export default notionPosts
`
}

async function readPreviousManifest() {
  try {
    return JSON.parse(await readFile(manifestFile, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return { pageIds: [] }
    throw error
  }
}

async function removeUnpublishedArtifacts(previousPageIds, currentPageIds) {
  const current = new Set(currentPageIds)

  for (const pageId of previousPageIds) {
    if (current.has(pageId)) continue

    await rm(path.join(notionDataDir, `${pageId}.json`), { force: true })
    await rm(path.join(publicNotionDir, pageId), { recursive: true, force: true })
  }
}

async function main() {
  await mkdir(notionDataDir, { recursive: true })
  await mkdir(publicNotionDir, { recursive: true })

  console.log('Resolving the Notion Blog Posts data source...')
  const dataSourceId = await resolveDataSourceId()
  const pages = await queryPublishedPages(dataSourceId)
  const previousManifest = await readPreviousManifest()

  const posts = []
  const slugs = new Set()

  for (const page of pages) {
    const post = await syncPage(page)
    if (slugs.has(post.slug)) {
      throw new Error(`Duplicate published Slug: ${post.slug}`)
    }

    slugs.add(post.slug)
    posts.push(post)
    console.log(`Synced: ${post.title} (${post.slug})`)
  }

  const currentPageIds = posts.map((post) => post.notionPageId)
  await removeUnpublishedArtifacts(previousManifest.pageIds || [], currentPageIds)
  await writeFile(generatedPostsFile, generatePostsSource(posts), 'utf8')
  await writeFile(
    manifestFile,
    `${JSON.stringify({ databaseId, dataSourceId, pageIds: currentPageIds }, null, 2)}\n`,
    'utf8',
  )

  console.log(`Notion sync complete: ${posts.length} published post(s).`)
}

await main()
