'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'

type PostLayoutProps = {
  children: ReactNode
  currentTags: string[]
  allTags: string[]
}

export default function PostLayout({
  children,
  currentTags,
  allTags,
}: PostLayoutProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? '태그 목록 닫기' : '태그 목록 열기'}
        aria-expanded={isOpen}
        aria-controls="post-tag-drawer"
        onClick={() => setIsOpen((open) => !open)}
        className="fixed left-4 top-4 z-[60] flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white/90 shadow-sm backdrop-blur transition hover:border-teal-400 hover:text-teal-600 dark:border-neutral-800 dark:bg-black/90 dark:hover:border-teal-500 dark:hover:text-teal-400"
      >
        <span className="h-0.5 w-5 rounded-full bg-current" />
        <span className="h-0.5 w-5 rounded-full bg-current" />
        <span className="h-0.5 w-5 rounded-full bg-current" />
      </button>

      {isOpen ? (
        <button
          type="button"
          aria-label="태그 목록 닫기"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] dark:bg-black/50"
        />
      ) : null}

      <aside
        id="post-tag-drawer"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 z-50 w-[min(19rem,86vw)] border-r border-neutral-200 bg-white px-6 pb-8 pt-24 shadow-xl transition-transform duration-200 dark:border-neutral-800 dark:bg-neutral-950 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Tags
        </p>
        <nav aria-label="전체 태그 목록" className="flex flex-col gap-1">
          <Link
            href="/blog"
            className="rounded-lg px-3 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-teal-600 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-teal-400"
          >
            전체
          </Link>
          {allTags.map((tag) => {
            const isCurrent = currentTags.includes(tag)

            return (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className={`rounded-lg px-3 py-2.5 text-sm transition ${
                  isCurrent
                    ? 'bg-teal-50 font-medium text-teal-600 dark:bg-teal-950/40 dark:text-teal-400'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-teal-600 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-teal-400'
                }`}
              >
                #{tag}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="post-detail relative w-[min(calc(100vw-2rem),80rem)] self-center">
        {children}
      </div>
    </>
  )
}
