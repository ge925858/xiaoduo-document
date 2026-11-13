import { notFound, redirect } from 'next/navigation'
import { ChapterEditor } from '@/components/studio/chapter-editor'
import { requireOwner } from '@/lib/server-session'
import {
  getArticleDraft,
  listArticleVersions,
} from '@/server/articles'
import { listCategories } from '@/server/categories'

export default async function ArticleEditorPage({
  params,
}: {
  params: Promise<{ articleId: string }>
}) {
  const session = await requireOwner()
  if (!session) redirect('/studio')
  const { articleId } = await params
  const article = await getArticleDraft(articleId)
  if (!article) notFound()

  return (
    <ChapterEditor
      article={article}
      categories={await listCategories()}
      versions={await listArticleVersions(articleId)}
    />
  )
}
