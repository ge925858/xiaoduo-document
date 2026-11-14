'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Menu,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BrandMark } from '@/components/brand-mark'
import { PublicSearchDialog } from '@/components/public-search-dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import type { PublicCategory } from '@/lib/public-library'
import { cn } from '@/lib/utils'

function decodedPathname(pathname: string) {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

export function PublicLibraryShell({
  categories,
  children,
}: {
  categories: PublicCategory[]
  children: ReactNode
}) {
  const pathname = decodedPathname(usePathname())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const contentRef = useRef<HTMLElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [pathname])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault()
        setSearchOpen(true)
        return
      }
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function toggleCategory(categoryId: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  return (
    <div className="library-shell">
      <a href="#library-content" className="skip-link">
        跳到正文
      </a>

      <header className="library-header">
        <button
          type="button"
          className="library-icon-button library-mobile-menu"
          onClick={() => setSidebarOpen(true)}
          aria-label="打开目录"
        >
          <Menu size={18} />
        </button>
        <Link
          href="/"
          className="library-brand"
          aria-label="知笺首页"
          onClick={() => setSidebarOpen(false)}
        >
          <BrandMark />
        </Link>
        <span className="library-header-divider" />
        <span className="library-header-title">笔记库</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            ref={searchButtonRef}
            type="button"
            className="library-search-button"
            aria-label="搜索"
            onClick={() => setSearchOpen(true)}
          >
            <Search aria-hidden="true" size={15} />
            <span>搜索</span>
          </button>
          <ThemeToggle className="library-icon-button" iconSize={16} />
        </div>
      </header>

      <aside
        className={cn('library-sidebar', sidebarOpen && 'is-open')}
        aria-label="笔记目录"
      >
        <button
          type="button"
          className="library-icon-button library-sidebar-close library-sidebar-close-floating"
          onClick={() => setSidebarOpen(false)}
          aria-label="关闭目录"
        >
          <X size={17} />
        </button>

        <nav className="library-directory" aria-label="笔记目录">
          {categories.map((category) => {
            const categoryPath = `/library/${category.slug}`
            const categoryActive = pathname === categoryPath
            const isCollapsed = collapsed.has(category.id)

            return (
              <section
                key={category.id}
                className={cn(
                  'library-category',
                  categoryActive && 'is-active',
                )}
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="library-category-toggle"
                    data-visual-dynamic
                    onClick={() => toggleCategory(category.id)}
                    aria-expanded={!isCollapsed}
                    aria-label={
                      isCollapsed
                        ? `展开${category.title}`
                        : `折叠${category.title}`
                    }
                  >
                    {isCollapsed ? (
                      <ChevronRight size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                  </button>
                  <Link
                    href={categoryPath}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'library-category-link',
                      pathname === categoryPath && 'is-active',
                    )}
                    aria-current={
                      pathname === categoryPath ? 'page' : undefined
                    }
                  >
                    <strong>{category.title}</strong>
                  </Link>
                </div>

                {!isCollapsed && (
                  <div className="library-chapters">
                    {category.chapters.map((chapter) => {
                      const chapterPath = `${categoryPath}/${chapter.path}`
                      return (
                        <Link
                          key={chapter.articleId}
                          href={chapterPath}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'library-chapter-link',
                            pathname === chapterPath && 'is-active',
                          )}
                          aria-current={
                            pathname === chapterPath ? 'page' : undefined
                          }
                        >
                          <span>{chapter.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </nav>

        <div className="library-sidebar-footer">
          <Link href="/" onClick={() => setSidebarOpen(false)}>
            <ArrowLeft size={13} />
            返回预览页
          </Link>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="library-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="关闭目录遮罩"
        />
      ) : null}

      <main
        ref={contentRef}
        id="library-content"
        className="library-content"
      >
        <div key={pathname} className="library-route-view">
          {children}
        </div>
      </main>
      <PublicSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        categories={categories}
        returnFocusTo={searchButtonRef}
      />
    </div>
  )
}
