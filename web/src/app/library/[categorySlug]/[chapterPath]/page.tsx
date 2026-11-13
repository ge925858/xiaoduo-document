import { notFound, redirect } from 'next/navigation'
import { MarkdownArticle } from '@/components/markdown-article'
import { AuthorAvatar } from '@/components/author-avatar'
import { PublicCollaborationForm } from '@/components/public-collaboration-form'
import Link from 'next/link'
import {
  getPublicChapterByPath,
  getPublicChapterNavigation,
  getPublicSiteProfile,
  resolvePublicRedirect,
} from '@/lib/public-library'
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
  const decodedCategorySlug = decodeURIComponent(categorySlug)
  const decodedChapterPath = decodeURIComponent(chapterPath)
  const requestPath = `/library/${decodedCategorySlug}/${decodedChapterPath}`
  const redirectTo = await resolvePublicRedirect(requestPath)
  if (redirectTo) redirect(encodeURI(redirectTo))
  const chapter = await getPublicChapterByPath(
    decodedCategorySlug,
    decodedChapterPath,
  )

  if (!chapter) notFound()
  const headings = markdownHeadings(chapter.markdown)
  const navigation = await getPublicChapterNavigation(
    decodedCategorySlug,
    decodedChapterPath,
  )
  const profile = await getPublicSiteProfile()

  return (
    <article className="chapter">
      <p className="eyebrow">{chapter.categoryTitle}</p>
      <h1>{chapter.title}</h1>
      <p className="chapter-byline">
        <AuthorAvatar
          name={profile?.authorName ?? chapter.authorName}
          avatarUrl={profile?.avatarUrl}
        />
        <strong>{profile?.authorName ?? chapter.authorName}</strong> ·{' '}
        {countWords(chapter.plainText)} 字 · 更新于{' '}
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
      <nav className="chapter-pagination" aria-label="章节翻页">
        {navigation?.previous ? (
          <Link
            href={`/library/${categorySlug}/${navigation.previous.path}`}
          >
            上一章 · {navigation.previous.title}
          </Link>
        ) : (
          <span />
        )}
        {navigation?.next ? (
          <Link
            className="chapter-next"
            href={`/library/${categorySlug}/${navigation.next.path}`}
          >
            下一章 · {navigation.next.title}
          </Link>
        ) : (
          <Link className="chapter-next" href={`/library/${categorySlug}`}>
            返回分类
          </Link>
        )}
      </nav>
      <PublicCollaborationForm articleId={chapter.id} />
    </article>
  )
}
