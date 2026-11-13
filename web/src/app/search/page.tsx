import Link from 'next/link'
import { searchPublicArticles } from '@/lib/public-library'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const query = (await searchParams).q?.trim() ?? ''
  const results = await searchPublicArticles(query)
  return (
    <main className="search-page">
      <Link href="/library">返回笔记库</Link>
      <p className="eyebrow">Search</p>
      <h1>搜索笔记库</h1>
      <form action="/search" role="search">
        <label>
          搜索公开章节
          <input name="q" defaultValue={query} required minLength={2} />
        </label>
        <button type="submit">搜索</button>
      </form>
      {query ? (
        <section>
          <p>{results.length} 条结果</p>
          <ol>
            {results.map((result) => (
              <li key={result.articleId}>
                <Link
                  href={`/library/${result.categorySlug}/${result.path}`}
                >
                  <strong>{result.title}</strong>
                  <span>{result.categoryTitle}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  )
}
