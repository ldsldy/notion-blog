'use client'
import Link from 'next/link'
import ThemeToggle from './theme'

const navItems = {
  '/': {
    name: 'Home',
  },
  '/blog': {
    name: 'Post',
  },
  'https://github.com/ldsldy': {
    name: 'Github',
  },
}

export function Navbar() {
  return (
    <aside className="-ml-[8px] mb-16 tracking-tight">
      <div className="lg:sticky lg:top-20">
        <nav
          className="relative flex flex-row items-start overflow-visible px-0 pb-0 fade"
          id="nav"
        >
          <div className="flex flex-row space-x-0 pr-10">
            {Object.entries(navItems).map(([path, { name }]) => {
              return (
                <Link
                  key={path}
                  href={path}
                  className="transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 m-1"
                >
                  {name}
                </Link>
              )
            })}
          </div>
          <div className="ml-auto shrink-0 pt-1">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </aside>
  )
}
