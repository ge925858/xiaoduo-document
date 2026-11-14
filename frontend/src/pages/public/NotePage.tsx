import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Home,
  UserRoundPlus,
} from 'lucide-react'
import {
  Link,
  Navigate,
  useLocation,
  useParams,
} from 'react-router-dom'
import { AuthorAvatar } from '../../components/AuthorAvatar'
import { CollaborationApplicationDialog } from '../../components/public/CollaborationApplicationDialog'
import { MarkdownArticle } from '../../components/public/MarkdownArticle'
import { usePageTitle } from '../../lib/usePageTitle'
import { markdownHeadings } from '../../lib/markdownHeadings'
import { formatDateTime } from '../../lib/text'
import { cn, countWords } from '../../lib/utils'
import {
  articleViewCount,
  categoryNotes,
  resolveRedirect,
  useSiteStore,
} from '../../store/siteStore'
import { NotFoundPage } from './NotFoundPage'

export function NotePage() {
  const { categorySlug, noteSlug } = useParams()
  const location = useLocation()
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const [applicationOpen, setApplicationOpen] = useState(false)
  const author = useSiteStore((state) => state.author)
  const studioRole = useSiteStore((state) => state.studioRole)
  const articleViewEvents = useSiteStore((state) => state.articleViewEvents)
  const recordArticleView = useSiteStore((state) => state.recordArticleView)
  const categories = useSiteStore((state) => state.categories)
  const notes = useSiteStore((state) => state.notes)
  const redirects = useSiteStore((state) => state.redirects)
  const category = categories.find((item) => item.slug === categorySlug)
  const note = notes.find(
    (item) => {
      const published = item.published
      return (
        item.publicationState === 'published' &&
        !item.trashedAt &&
        published !== null &&
        published.categoryId === category?.id &&
        published.slug === noteSlug
      )
    },
  )
  const published = note?.published ?? null
  const markdown = published?.markdown ?? ''
  const headings = markdownHeadings(markdown)
  const minHeadingLevel = Math.min(...headings.map((heading) => heading.level))
  const viewCount = note
    ? articleViewCount(articleViewEvents, note.id)
    : 0
  const contributors = note
    ? [
        ...new Map(
          note.versions
            .map((version) => version.author)
            .filter(
              (versionAuthor) =>
                versionAuthor?.role === 'collaborator',
            )
            .map((versionAuthor) => [
              versionAuthor!.id,
              versionAuthor!,
            ]),
        ).values(),
      ]
    : []
  const redirectTo = resolveRedirect(redirects, location.pathname)

  usePageTitle(published ? `${published.title} · 知笺` : '未找到 · 知笺')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [noteSlug])

  useEffect(() => {
    if (!note || studioRole === 'owner') return
    let referrerDomain = '直接访问'
    if (document.referrer) {
      try {
        referrerDomain = new URL(document.referrer).hostname || '直接访问'
      } catch {
        referrerDomain = '直接访问'
      }
    }
    recordArticleView({
      noteId: note.id,
      ip: '127.0.0.1',
      referrerDomain,
    })
  }, [note, recordArticleView, studioRole])

  useEffect(() => {
    const currentHeadings = markdownHeadings(markdown)
    if (!currentHeadings.length) return
    const scrollRoot = document.getElementById('library-content')
    if (!scrollRoot) return

    let frame = 0
    const updateActiveHeading = () => {
      let current = currentHeadings[0]?.id ?? null
      const threshold =
        scrollRoot.getBoundingClientRect().top +
        Math.min(360, scrollRoot.clientHeight * 0.42)
      for (const heading of currentHeadings) {
        const element = document.getElementById(heading.id)
        if (element && element.getBoundingClientRect().top <= threshold) {
          current = heading.id
        }
      }
      if (
        scrollRoot.scrollTop + scrollRoot.clientHeight >=
        scrollRoot.scrollHeight - 4
      ) {
        current = currentHeadings.at(-1)?.id ?? current
      }
      setActiveHeadingId(current)
    }
    const onScroll = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(updateActiveHeading)
    }
    onScroll()
    scrollRoot.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      scrollRoot.removeEventListener('scroll', onScroll)
    }
  }, [markdown])

  if (redirectTo) return <Navigate to={redirectTo} replace />
  if (!category || !note || !published) return <NotFoundPage />

  const chapters = categoryNotes(category, notes)
  const index = chapters.findIndex((item) => item.id === note.id)
  const previous = index > 0 ? chapters[index - 1] : null
  const next = index < chapters.length - 1 ? chapters[index + 1] : null
  return (
    <article className="chapter-page">
      <div className="chapter-main-grid">
        <div>
          <nav className="chapter-breadcrumb" aria-label="面包屑">
            <Link to="/" className="breadcrumb-home" aria-label="返回预览页">
              <Home size={14} />
            </Link>
            <ChevronRight size={13} className="breadcrumb-separator" />
            <Link
              to={`/library/${category.slug}`}
              className="breadcrumb-category"
            >
              {category.title}
            </Link>
            <ChevronRight size={13} className="breadcrumb-separator" />
            <span className="breadcrumb-current">{published.title}</span>
          </nav>

          <header className="chapter-header">
            <h1>{published.title}</h1>
            <div className="chapter-byline">
              <AuthorAvatar
                name={author.name}
                avatarUrl={author.avatarUrl}
                size="md"
              />
              <strong>{author.name}</strong>
              <span className="chapter-byline-dot" aria-hidden="true" />
              <span>{countWords(published.plainText)} 字</span>
              <span className="chapter-byline-dot" aria-hidden="true" />
              <span
                className="article-view-count"
                data-visual-dynamic
              >
                {viewCount} 次浏览
              </span>
              <span className="chapter-byline-dot" aria-hidden="true" />
              <span>
                更新于{' '}
                <time dateTime={published.publishedAt}>
                  {formatDateTime(published.publishedAt)}
                </time>
              </span>
              {contributors.length ? (
                <span className="chapter-contributors">
                  {contributors.map((contributor) => (
                    <span key={contributor.id}>
                      <AuthorAvatar
                        name={contributor.name}
                        size="sm"
                      />
                      {contributor.name}
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
          </header>

          <div className="chapter-body">
            <MarkdownArticle markdown={published.markdown} />
          </div>

          <nav className="chapter-pagination" aria-label="章节翻页">
            {previous?.published ? (
              <Link
                to={`/library/${category.slug}/${previous.published.slug}`}
              >
                <span>上一章</span>
                <strong>
                  <ArrowLeft size={15} />
                  {previous.published.title}
                </strong>
              </Link>
            ) : (
              <span />
            )}
            {next?.published ? (
              <Link
                to={`/library/${category.slug}/${next.published.slug}`}
                className="text-right"
              >
                <span>下一章</span>
                <strong>
                  {next.published.title}
                  <ArrowRight size={15} />
                </strong>
              </Link>
            ) : (
              <Link to={`/library/${category.slug}`} className="text-right">
                <span>返回目录</span>
                <strong>
                  查看全部章节
                  <ArrowRight size={15} />
                </strong>
              </Link>
            )}
          </nav>

          {!studioRole && (
            <section className="collaboration-apply-card">
              <div>
                <strong>愿意一起完善这篇笔记？</strong>
                <p>申请通过后，只会获得这篇文章的编辑权限。</p>
              </div>
              <button
                type="button"
                className="studio-secondary-button"
                onClick={() => setApplicationOpen(true)}
              >
                <UserRoundPlus size={14} />
                申请参与编辑
              </button>
            </section>
          )}
        </div>

        {!!headings.length && (
          <aside className="chapter-toc" aria-label="本章目录">
            <p className="section-kicker">On this page</p>
            <nav>
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={cn(
                    heading.level === minHeadingLevel && 'is-top-level',
                    activeHeadingId === heading.id && 'is-current',
                  )}
                  data-level={heading.level}
                  style={{
                    paddingLeft: `${(heading.level - minHeadingLevel) * 16}px`,
                  }}
                  aria-current={
                    activeHeadingId === heading.id ? 'location' : undefined
                  }
                  onClick={() => setActiveHeadingId(heading.id)}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>

      <CollaborationApplicationDialog
        open={applicationOpen}
        onOpenChange={setApplicationOpen}
        noteId={note.id}
        noteTitle={published.title}
      />
    </article>
  )
}
