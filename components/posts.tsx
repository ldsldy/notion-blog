import Image from 'next/image'
import Link from 'next/link'
import posts from '../content/posts'

const sortedPosts = () =>
  [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

export function BlogPosts() {
  return (
    <div>
      {sortedPosts().map((post) => (
          <Link
            key={post.slug}
            className="flex flex-col space-y-1 mb-4"
            href={`/blog/${post.slug}`}
          >
            <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
              <p className="text-neutral-600 dark:text-neutral-400 w-[100px] tabular-nums">
                {post.date}
              </p>
              <p className="text-neutral-900 dark:text-neutral-100 tracking-tight">
                {post.title}
              </p>
            </div>
          </Link>
      ))}
    </div>
  )
}

export function RecentPosts() {
  const recentPosts = sortedPosts().slice(0, 3)

  return (
    <section className="mt-10 border-t border-neutral-200 pt-7 dark:border-neutral-800">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">최근 포스팅</h2>

      {recentPosts.length > 0 ? (
        <div className="grid gap-3">
          {recentPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex items-center gap-4 rounded-xl border border-neutral-200 p-3 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
            >
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
                {post.image ? (
                  <Image
                    src={post.image}
                    alt={`${post.title} 썸네일`}
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-xs font-medium text-neutral-500 dark:from-neutral-800 dark:to-neutral-900 dark:text-neutral-400">
                    No image
                  </div>
                )}
              </div>

              <h3 className="line-clamp-2 text-sm font-medium leading-6 text-neutral-900 transition-colors group-hover:text-blue-600 dark:text-neutral-100 dark:group-hover:text-blue-400">
                {post.title}
              </h3>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          아직 게시된 글이 없습니다.
        </p>
      )}
    </section>
  )
}
