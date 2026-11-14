import {
  ArrowRight,
  FileText,
  Layers3,
  Search,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { usePageTitle } from '../../lib/usePageTitle'
import { useSiteStore } from '../../store/siteStore'

export function SearchResultsPage() {
  usePageTitle('搜索 · 知笺')
  const location = useLocation()
  const notes = useSiteStore((state) => state.notes)
  const categories = useSiteStore((state) => state.categories)
  const query =
    new URLSearchParams(location.search).get('q')?.trim() ?? ''
  const normalized = query.toLowerCase()
  const categoryMatches = normalized
    ? categories.filter((category) =>
        category.title.toLowerCase().includes(normalized),
      )
    : []
  const results = notes
    .filter(
      (note) =>
        note.publicationState === 'published' &&
        note.published !== null &&
        !note.trashedAt &&
        normalized &&
        (note.published.title.toLowerCase().includes(normalized) ||
          note.published.plainText.toLowerCase().includes(normalized)),
    )
    .sort((left, right) =>
      (right.published?.publishedAt ?? '').localeCompare(
        left.published?.publishedAt ?? '',
      ),
    )
  const grouped = new Map<
    string,
    { title: string; slug: string; results: typeof results }
  >()
  const orderedResults = categories.flatMap((category) =>
    results.filter(
      (note) => note.published?.categoryId === category.id,
    ),
  )
  for (const note of orderedResults) {
    const published = note.published
    if (!published) continue
    const category = categories.find(
      (item) => item.id === published.categoryId,
    )
    if (!category) continue
    const group = grouped.get(category.slug) ?? {
      title: category.title,
      slug: category.slug,
      results: [],
    }
    group.results.push(note)
    grouped.set(category.slug, group)
  }

  return (
    <div className="chapter-index-page search-results-page">
      <header className="chapter-index-header">
        <p className="section-kicker">Search</p>
        <h1>搜索笔记库</h1>
        <p className="chapter-index-description">
          搜索已发布章节与分类，草稿和回收站内容不会出现。
        </p>
      </header>

      <form
        action="/search"
        role="search"
        className="search-results-form"
      >
        <Search size={17} aria-hidden="true" />
        <input
          name="q"
          type="search"
          aria-label="搜索公开章节"
          defaultValue={query}
          placeholder="搜索分类或章节"
          required
          minLength={2}
        />
        <button type="submit">搜索</button>
      </form>

      <p className="search-results-summary">
        {query ? `${results.length} 条结果` : '输入关键词开始搜索'}
      </p>

      {categoryMatches.length ? (
        <section className="search-result-group">
          <h2>分类</h2>
          {categoryMatches.map((category) => (
            <Link
              key={category.id}
              to={`/library/${category.slug}`}
              className="search-result-row"
            >
              <span className="search-result-icon">
                <Layers3 size={15} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--ink)]">
                {category.title}
              </span>
              <ArrowRight
                size={14}
                className="text-[var(--muted-faint)]"
              />
            </Link>
          ))}
        </section>
      ) : null}

      {Array.from(grouped.values()).map((group) => (
        <section key={group.slug} className="search-result-group">
          <h2>{group.title}</h2>
          {group.results.map((note) => {
            const published = note.published
            if (!published) return null
            return (
              <Link
                key={note.id}
                to={`/library/${group.slug}/${published.slug}`}
                className="search-result-row"
              >
                <span className="search-result-icon">
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                    {published.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs leading-5 text-[var(--muted)]">
                    {published.plainText.slice(0, 110)}
                  </span>
                </span>
                <ArrowRight
                  size={14}
                  className="text-[var(--muted-faint)]"
                />
              </Link>
            )
          })}
        </section>
      ))}

      {query &&
      !categoryMatches.length &&
      results.length === 0 ? (
        <div className="search-results-empty">
          <p className="font-display text-xl text-[var(--ink)]">
            没有找到相关内容
          </p>
          <p>试试更短的词。</p>
        </div>
      ) : null}
    </div>
  )
}
