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
    <section className="relative left-1/2 mt-16 w-[min(calc(100vw-2rem),64rem)] -translate-x-1/2">
      <div className="text-center">
        <h2 className="text-2xl font-medium tracking-tight">최근 포스팅</h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          새롭게 올라온 글을 만나보세요.
        </p>
      </div>

      {recentPosts.length > 0 ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {recentPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex min-h-44 items-stretch gap-5 border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-black dark:hover:border-neutral-600"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {post.description}
                </p>

                <h3 className="mt-3 line-clamp-2 text-lg font-medium leading-7 text-neutral-900 transition-colors group-hover:text-blue-600 dark:text-neutral-100 dark:group-hover:text-blue-400">
                  {post.title}
                </h3>

                <div className="mt-auto flex flex-wrap gap-x-2 gap-y-1 pt-5 text-sm text-neutral-400 dark:text-neutral-500">
                  {(post.tags?.length ? post.tags : ['미분류']).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>

              <div className="relative h-28 w-28 shrink-0 self-center overflow-hidden bg-neutral-100 dark:bg-neutral-900">
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
