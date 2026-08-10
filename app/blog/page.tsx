import PostExplorer from 'components/post-explorer'
import posts from '../../content/posts'

export const metadata = {
  title: 'Post',
  description: '태그별로 블로그 포스팅을 찾아보세요.',
}

export default function Page() {
  const postSummaries = posts.map((post) => ({
    title: post.title,
    slug: post.slug,
    date: post.date,
    description: post.description,
    image: post.image,
    tags: post.tags ?? [],
  }))

  return (
    <section className="relative left-1/2 w-[min(calc(100vw-2rem),64rem)] -translate-x-1/2">
      <header className="mb-10 border-b border-neutral-200 pb-8 dark:border-neutral-800">
        <h1 className="text-3xl font-semibold tracking-tight">Post</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          태그별로 관심 있는 글을 찾아보세요.
        </p>
      </header>

      <PostExplorer posts={postSummaries} />
    </section>
  )
}
