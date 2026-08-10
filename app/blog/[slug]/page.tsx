import { notFound } from 'next/navigation'
import { baseUrl } from 'app/sitemap'
import posts from 'content/posts'
import NotionRenderer from 'components/notion-renderer'
import Comment from 'components/comment'
import PostLayout from 'components/post-layout'

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export const dynamicParams = false

export function generateMetadata({ params }) {
  let post = posts.find((post) => post.slug === params.slug)
  if (!post) {
    return
  }
  let {
    title,
    date: publishedTime,
    description,
    image,
  } = post
  let ogImage = image
    ? image
    : `${baseUrl}/og.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${baseUrl}/blog/${post.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function Blog({ params }) {
  const { slug } = await params
  let post = posts.find((post) => post.slug === slug)
  if (!post) {
    notFound()
  }

  const allTags = Array.from(
    new Set(posts.flatMap((item) => item.tags ?? [])),
  ).sort((a, b) => a.localeCompare(b, 'ko'))

  return (
    <PostLayout currentTags={post.tags ?? []} allTags={allTags}>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.date,
            dateModified: post.date,
            description: post.description,
            image: post.image
              ? `${baseUrl}${post.image}`
              : `${baseUrl}/og.png`,
            url: `${baseUrl}/blog/${post.slug}`,
            author: {
              '@type': 'Person',
              name: 'My Portfolio',
            },
          }),
        }}
      />
      <NotionRenderer post={post} />
      <Comment />
    </PostLayout>
  )
}
