import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChapterEditor } from '@/components/studio/chapter-editor'
import { requireStudioSession } from '@/lib/server-session'
import {
  getAccessibleArticle,
  listAccessibleCategories,
  studioActorFromUser,
} from '@/server/article-access'
import { listArticleVersions } from '@/server/articles'

export default async function ArticleEditorPage({
  params,
}: {
  params: Promise<{ articleId: string }>
}) {
  const session = await requireStudioSession()
  if (!session) redirect('/studio/login')
  const { articleId } = await params
  const actor = studioActorFromUser(session.user)
  const article = await getAccessibleArticle(actor, articleId)
  if (!article) {
    return (
      <section>
        <p className="eyebrow">Permission required</p>
        <h1>无权访问此章节</h1>
        <p>当前账号没有这篇章节的文章授权。</p>
        <Link href="/studio">返回协作文章</Link>
      </section>
    )
  }

  return (
    <ChapterEditor
      article={article}
      categories={await listAccessibleCategories(actor)}
      versions={await listArticleVersions(articleId)}
      role={actor.role}
    />
  )
}
