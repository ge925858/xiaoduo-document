import {
  getPublicChapterByPath,
  listPublicLibrary,
  type PublicChapter,
  type PublicSiteProfile,
} from '@/lib/public-library'

export interface ReaderDiscoveryEntry {
  articleId: string
  title: string
  categorySlug: string
  path: string
  markdown: string
  plainText: string
  publishedAt: string
  authorName: string
  contributors: string[]
  previewImage: string | null
}

function firstMarkdownImage(markdown: string): string | null {
  return /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/.exec(markdown)?.[1] ?? null
}

function summarize(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim()
  return compact.length > 180 ? `${compact.slice(0, 180)}…` : compact
}

export function toReaderDiscoveryEntry(
  chapter: PublicChapter,
): ReaderDiscoveryEntry {
  return {
    articleId: chapter.id,
    title: chapter.title,
    categorySlug: chapter.categorySlug,
    path: chapter.path,
    markdown: chapter.markdown,
    plainText: chapter.plainText,
    publishedAt: chapter.publishedAt,
    authorName: chapter.authorName,
    contributors: chapter.contributors.map((contributor) => contributor.name),
    previewImage: firstMarkdownImage(chapter.markdown),
  }
}

export async function listReaderDiscoveryEntries() {
  const library = await listPublicLibrary()
  const entries: ReaderDiscoveryEntry[] = []
  for (const category of library) {
    for (const summary of category.chapters) {
      const chapter = await getPublicChapterByPath(category.slug, summary.path)
      if (chapter) entries.push(toReaderDiscoveryEntry(chapter))
    }
  }
  return entries
}

export function buildChapterOpenGraph(
  entry: ReaderDiscoveryEntry,
  profile: PublicSiteProfile | null,
  siteUrl: string,
) {
  return {
    title: entry.title,
    description: summarize(entry.plainText),
    author: profile?.authorName ?? entry.authorName,
    contributors: entry.contributors,
    image: entry.previewImage,
    url: `${siteUrl.replace(/\/+$/, '')}/library/${entry.categorySlug}/${entry.path}`,
  }
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function buildRssXml(
  entries: ReaderDiscoveryEntry[],
  siteUrl: string,
  siteTitle: string,
) {
  const base = siteUrl.replace(/\/+$/, '')
  const items = [...entries]
    .sort(
      (left, right) =>
        new Date(right.publishedAt).getTime() -
        new Date(left.publishedAt).getTime(),
    )
    .map((entry) => {
      const link = `${base}/library/${entry.categorySlug}/${entry.path}`
      return `<item>
  <title>${escapeXml(entry.title)}</title>
  <link>${escapeXml(link)}</link>
  <guid isPermaLink="true">${escapeXml(link)}</guid>
  <description>${escapeXml(summarize(entry.plainText))}</description>
  <author>${escapeXml(entry.authorName)}</author>
  <pubDate>${new Date(entry.publishedAt).toUTCString()}</pubDate>
</item>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(siteTitle)}</title>
  <link>${escapeXml(base)}</link>
  <description>${escapeXml(siteTitle)}的公开知识书更新</description>
  <language>zh-CN</language>
${items}
</channel>
</rss>`
}
