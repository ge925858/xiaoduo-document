import { redirect } from 'next/navigation'
import { ArticleDashboard } from '@/components/studio/article-dashboard'
import { requireStudioSession } from '@/lib/server-session'
import {
  listAccessibleArticles,
  listAccessibleCategories,
  studioActorFromUser,
} from '@/server/article-access'
import { listArticleVersions } from '@/server/articles'

export default async function StudioPage() {
  const session = await requireStudioSession()
  if (!session) redirect('/studio/login')

  const actor = studioActorFromUser(session.user)
  const isOwner = actor.role === 'owner'
  const categories = await listAccessibleCategories(actor)
  const accessibleArticles = await listAccessibleArticles(actor)
  const articles = await Promise.all(
    accessibleArticles.map(async (article) => {
      const publishedVersions =
        article.publicationState === 'published'
          ? (await listArticleVersions(article.id)).filter(
              (version) => version.kind === 'published',
            )
          : []
      const latestPublished = publishedVersions[0]
      return {
        ...article,
        pendingUpdate:
          article.publicationState === 'published' &&
          (!latestPublished ||
            latestPublished.title !== article.title ||
            latestPublished.categoryId !== article.categoryId ||
            latestPublished.markdown !== article.markdown),
      }
    }),
  )

  return (
    <section>
      <ArticleDashboard
        categories={categories.map((category) => ({
          id: category.id,
          title: category.title,
        }))}
        articles={articles.map((article) => ({
          id: article.id,
          title: article.title,
          categoryId: article.categoryId,
          categoryTitle: article.categoryTitle,
          plainText: article.plainText,
          publicationState: article.publicationState,
          revision: article.revision,
          updatedAt: article.updatedAt,
          pendingUpdate: article.pendingUpdate,
        }))}
        canManage={isOwner}
      />
    </section>
  )
}
