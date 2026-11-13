import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { article, articleVersion, category } from '@/db/schema'

export interface PublicChapter {
  id: string
  title: string
  categoryId: string
  categoryTitle: string
  categorySlug: string
  path: string
  markdown: string
  plainText: string
  publishedAt: string
  authorId: string
  authorName: string
  authorRole: 'owner' | 'collaborator'
}

export async function getPublicChapterByPath(
  categorySlug: string,
  chapterPath: string,
): Promise<PublicChapter | null> {
  const publishedArticles = await db
    .select({
      id: article.id,
      categoryId: category.id,
      categoryTitle: category.title,
      categorySlug: category.slug,
    })
    .from(article)
    .innerJoin(category, eq(article.categoryId, category.id))
    .where(
      and(
        eq(category.slug, categorySlug),
        eq(article.publicationState, 'published'),
        isNull(article.trashedAt),
      ),
    )

  for (const current of publishedArticles) {
    const [version] = await db
      .select({
        title: articleVersion.title,
        path: articleVersion.path,
        markdown: articleVersion.markdown,
        plainText: articleVersion.plainText,
        publishedAt: articleVersion.createdAt,
        authorId: articleVersion.authorId,
        authorName: articleVersion.authorName,
        authorRole: articleVersion.authorRole,
      })
      .from(articleVersion)
      .where(
        and(
          eq(articleVersion.articleId, current.id),
          eq(articleVersion.kind, 'published'),
        ),
      )
      .orderBy(desc(articleVersion.createdAt), desc(articleVersion.id))
      .limit(1)
    if (version?.path !== chapterPath) continue
    return {
      ...current,
      ...version,
    }
  }

  return null
}
