import posts from "content/posts"

export const baseUrl = 'https://notion-blog-7ki.pages.dev'

export default async function sitemap2() {
  let blogs = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date,
  }))

  let routes = ['', '/blog', '/guide', '/guide/kr'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs]
}
