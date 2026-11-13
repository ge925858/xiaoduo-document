'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface DirectoryCategory {
  id: string
  title: string
  slug: string
  chapters: Array<{ articleId: string; title: string; path: string }>
}

export function PublicLibraryNav({
  categories,
}: {
  categories: DirectoryCategory[]
}) {
  const pathname = usePathname()

  return (
    <nav className="public-directory" aria-label="笔记目录">
      {categories.map((category) => {
        const categoryPath = `/library/${category.slug}`
        const categoryActive =
          pathname === categoryPath ||
          pathname.startsWith(`${categoryPath}/`)
        return (
          <section key={category.id} data-active={categoryActive}>
            <Link
              href={categoryPath}
              className="directory-category"
              aria-current={pathname === categoryPath ? 'page' : undefined}
            >
              {category.title}
            </Link>
            <div>
              {category.chapters.map((chapter) => {
                const chapterPath = `${categoryPath}/${chapter.path}`
                return (
                  <Link
                    key={chapter.articleId}
                    href={chapterPath}
                    className="directory-chapter"
                    aria-current={
                      decodeURIComponent(pathname) === chapterPath
                        ? 'page'
                        : undefined
                    }
                  >
                    {chapter.title}
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </nav>
  )
}
