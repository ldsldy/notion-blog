'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

type PostSummary = {
  title: string
  slug: string
  date: string
  description: string
  image?: string
  tags: string[]
}

const ALL_POSTS = '전체'

export default function PostExplorer({ posts }: { posts: PostSummary[] }) {
  const [selectedTag, setSelectedTag] = useState(ALL_POSTS)

  const tags = useMemo(
    () => Array.from(new Set(posts.flatMap((post) => post.tags))).sort(),
    [posts],
  )

  const visiblePosts = useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    if (selectedTag === ALL_POSTS) return sorted
    return sorted.filter((post) => post.tags.includes(selectedTag))
  }, [posts, selectedTag])

  return (
    <div className="sm:flex sm:items-start sm:gap-12">
      <aside className="mb-8 shrink-0 sm:sticky sm:top-8 sm:mb-0 sm:w-40">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Tags
        </p>
        <nav
          aria-label="태그 필터"
          className="flex gap-2 overflow-x-auto pb-2 sm:flex-col sm:gap-1 sm:overflow-visible sm:pb-0"
        >
          {[ALL_POSTS, ...tags].map((tag) => {
            const isSelected = selectedTag === tag

            return (
              <button
                key={tag}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedTag(tag)}
                className={`shrink-0 rounded-md px-3 py-2 text-left text-sm transition-colors sm:w-full ${
                  isSelected
                    ? 'bg-teal-50 font-medium text-teal-600 dark:bg-teal-950/40 dark:text-teal-400'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 border-t border-neutral-200 dark:border-neutral-800">
        {visiblePosts.length > 0 ? (
          visiblePosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex gap-6 border-b border-neutral-200 py-7 dark:border-neutral-800"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <h2 className="text-xl font-medium leading-8 tracking-tight text-neutral-900 transition-colors group-hover:text-teal-600 dark:text-neutral-100 dark:group-hover:text-teal-400">
                  {post.title}
                </h2>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {post.description}
                </p>

                <div className="mt-auto flex flex-wrap gap-x-2 gap-y-1 pt-4 text-sm text-teal-500 dark:text-teal-400">
                  {(post.tags.length ? post.tags : ['미분류']).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>

              <div className="relative h-28 w-36 shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                {post.image ? (
                  <Image
                    src={post.image}
                    alt={`${post.title} 썸네일`}
                    fill
                    sizes="144px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-xs text-neutral-400 dark:from-neutral-800 dark:to-neutral-900 dark:text-neutral-500">
                    No image
                  </div>
                )}
              </div>
            </Link>
          ))
        ) : (
          <p className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
            이 태그에 등록된 글이 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}
