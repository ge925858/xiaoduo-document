import { notFound } from 'next/navigation'
import { MarkdownArticle } from '@/components/markdown-article'
import { getPublicChapterByPath } from '@/lib/public-library'

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

  return (
    <main className="chapter">
      <p className="eyebrow">{chapter.categoryTitle}</p>
      <h1>{chapter.title}</h1>
      <p className="chapter-byline">
        {chapter.authorName} · 更新于{' '}
        <time dateTime={chapter.publishedAt}>
          {new Intl.DateTimeFormat('zh-CN', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Asia/Shanghai',
          }).format(new Date(chapter.publishedAt))}
        </time>
      </p>
      <MarkdownArticle markdown={chapter.markdown} />
    </main>
  )
}
