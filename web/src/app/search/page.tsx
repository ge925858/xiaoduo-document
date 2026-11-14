import type { Metadata } from 'next'
import { PublicSearchResults } from '@/components/public-search-results'
import {
  listPublicLibrary,
  searchPublicArticles,
} from '@/lib/public-library'

export const metadata: Metadata = {
  title: '搜索 · 知笺',
  description: '搜索知笺已发布分类和章节。',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const query = (await searchParams).q?.trim() ?? ''
  const [results, categories] = await Promise.all([
    searchPublicArticles(query),
    listPublicLibrary(),
  ])
  return (
    <PublicSearchResults
      query={query}
      results={results}
      categories={categories}
    />
  )
}
