import { ArrowRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { usePageTitle } from '../../lib/usePageTitle'
import { formatRelativeTime } from '../../lib/text'
import { categoryNotes, useSiteStore } from '../../store/siteStore'
import { NotFoundPage } from './NotFoundPage'

export function CategoryPage() {
  const { categorySlug } = useParams()
  const categories = useSiteStore((state) => state.categories)
  const notes = useSiteStore((state) => state.notes)
  const category = categories.find((item) => item.slug === categorySlug)
  usePageTitle(category ? `${category.title} · 知笺` : '未找到 · 知笺')
  if (!category) return <NotFoundPage />

  const chapters = categoryNotes(category, notes)
  const categoryIndex = categories
    .slice()
    .sort((a, b) => a.order - b.order)
    .findIndex((item) => item.id === category.id)

  return (
    <div className="chapter-index-page">
      <header className="chapter-index-header">
        <p className="section-kicker">
          Category {String(categoryIndex + 1).padStart(2, '0')}
        </p>
        <h1>{category.title}</h1>
      </header>

      <div className="chapter-list">
        <div className="chapter-list-heading">
          <span>章节目录</span>
          <span>{chapters.length} 篇</span>
        </div>
        {chapters.map((note, index) => {
          const published = note.published
          if (!published) return null
          return (
          <Link
            key={note.id}
            to={`/library/${category.slug}/${published.slug}`}
            className="chapter-list-row group"
          >
            <span className="chapter-number">
              {categoryIndex + 1}.{index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-3">
                <span className="text-[22px] font-semibold text-[var(--ink)] group-hover:text-[var(--accent)]">
                  {published.title}
                </span>
              </span>
            </span>
            <span className="chapter-list-meta">
              {formatRelativeTime(published.publishedAt)}
              <ArrowRight size={14} />
            </span>
          </Link>
          )
        })}
        {!chapters.length && (
          <p className="py-16 text-center text-sm text-[var(--muted)]">
            这个分类暂时没有公开章节。
          </p>
        )}
      </div>
    </div>
  )
}
