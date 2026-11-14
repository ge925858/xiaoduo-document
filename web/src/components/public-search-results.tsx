import Link from 'next/link'
import {
  ArrowRight,
  FileText,
  Layers3,
  Search,
} from 'lucide-react'
import type {
  PublicCategory,
  PublicSearchResult,
} from '@/lib/public-library'

export function PublicSearchResults({
  query,
  results,
  categories,
}: {
  query: string
  results: PublicSearchResult[]
  categories: PublicCategory[]
}) {
  const normalized = query.trim().toLowerCase()
  const categoryMatches = normalized
    ? categories.filter((category) =>
        category.title.toLowerCase().includes(normalized),
      )
    : []
  const grouped = new Map<
    string,
    {
      title: string
      slug: string
      results: PublicSearchResult[]
    }
  >()
  const orderedResults = categories.flatMap((category) =>
    results.filter(
      (result) => result.categorySlug === category.slug,
    ),
  )
  for (const result of orderedResults) {
    const group = grouped.get(result.categorySlug) ?? {
      title: result.categoryTitle,
      slug: result.categorySlug,
      results: [],
    }
    group.results.push(result)
    grouped.set(result.categorySlug, group)
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
        <Search size={21} aria-hidden="true" />
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
              href={`/library/${category.slug}`}
              className="search-result-row"
            >
              <span className="search-result-icon">
                <Layers3 size={19} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--ink)]">
                {category.title}
              </span>
              <ArrowRight
                size={18}
                className="text-[var(--muted-faint)]"
              />
            </Link>
          ))}
        </section>
      ) : null}

      {Array.from(grouped.values()).map((group) => (
        <section key={group.slug} className="search-result-group">
          <h2>{group.title}</h2>
          {group.results.map((result) => (
            <Link
              key={result.articleId}
              href={`/library/${result.categorySlug}/${result.path}`}
              className="search-result-row"
            >
              <span className="search-result-icon">
                <FileText size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                  {result.title}
                </span>
                <span className="mt-0.5 block truncate text-xs leading-5 text-[var(--muted)]">
                  {result.plainText.slice(0, 110)}
                </span>
              </span>
              <ArrowRight
                size={18}
                className="text-[var(--muted-faint)]"
              />
            </Link>
          ))}
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
