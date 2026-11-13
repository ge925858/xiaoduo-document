import { notFound } from 'next/navigation'
import { MarkdownArticle } from '@/components/markdown-article'
import { getPublicChapterByPath } from '@/lib/public-library'
import { countWords, markdownHeadings } from '@/lib/markdown-headings'

interface ChapterPageProps {
  params: Promise<{
    categorySlug: string
    chapterPath: string
  }>
}

export const revalidate = 60

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { categorySlug, chapterPath } = await params
  const chapter = await getPublicChapterByPath(
    decodeURIComponent(categorySlug),
    decodeURIComponent(chapterPath),
  )

  if (!chapter) notFound()
  const headings = markdownHeadings(chapter.markdown)

  return (
    <main className="chapter">
      <p className="eyebrow">{chapter.categoryTitle}</p>
      <h1>{chapter.title}</h1>
      <p className="chapter-byline">
        {chapter.authorName} · {countWords(chapter.plainText)} 字 · 更新于{' '}
        <time dateTime={chapter.publishedAt}>
          {new Intl.DateTimeFormat('zh-CN', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Asia/Shanghai',
          }).format(new Date(chapter.publishedAt))}
        </time>
      </p>
      <div className="chapter-public-grid">
        <MarkdownArticle markdown={chapter.markdown} />
        {headings.length ? (
          <aside className="chapter-toc">
            <p className="eyebrow">On this page</p>
            <nav aria-label="本章目录">
              {headings.map((heading) => (
                <a key={heading.id} href={`#${heading.id}`}>
                  {heading.text}
                </a>
              ))}
            </nav>
          </aside>
        ) : null}
      </div>
    </main>
  )
}
