import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { PublicCategory } from '@/lib/public-library'

export function PublicLibraryIndex({
  categories,
}: {
  categories: PublicCategory[]
}) {
  if (!categories.length) {
    return (
      <div className="library-empty-page">
        <p className="section-kicker">Empty library</p>
        <h1>笔记库还是空的</h1>
        <p>站主创建并发布第一个分类和章节后，会在这里出现。</p>
      </div>
    )
  }

  return (
    <div className="chapter-index-page">
      <header className="chapter-index-header">
        <p className="section-kicker">Library index</p>
        <h1>笔记库</h1>
        <p className="chapter-index-description">
          按固定分类整理长期笔记。选择一个分类，继续阅读其中的公开章节。
        </p>
      </header>

      <div className="chapter-list">
        <div className="chapter-list-heading">
          <span>分类目录</span>
          <span>{categories.length} 个分类</span>
        </div>
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={`/library/${category.slug}`}
            className="chapter-list-row group"
          >
            <span className="chapter-number">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-[24px] font-semibold text-[var(--ink)] group-hover:text-[var(--accent)]">
                {category.title}
              </span>
            </span>
            <span className="chapter-list-meta">
              {category.chapters.length} 篇
              <ArrowRight size={18} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
