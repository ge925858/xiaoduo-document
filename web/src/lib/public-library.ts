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
  const rows = await db
    .select({
      id: article.id,
      title: articleVersion.title,
      categoryId: category.id,
      categoryTitle: category.title,
      categorySlug: category.slug,
      path: articleVersion.path,
      markdown: articleVersion.markdown,
      plainText: articleVersion.plainText,
      publishedAt: articleVersion.createdAt,
      authorId: articleVersion.authorId,
      authorName: articleVersion.authorName,
      authorRole: articleVersion.authorRole,
    })
    .from(article)
    .innerJoin(category, eq(article.categoryId, category.id))
    .innerJoin(
      articleVersion,
      and(
        eq(articleVersion.articleId, article.id),
        eq(articleVersion.kind, 'published'),
      ),
    )
    .where(
      and(
        eq(category.slug, categorySlug),
        eq(article.path, chapterPath),
        eq(article.publicationState, 'published'),
        isNull(article.trashedAt),
      ),
    )
    .orderBy(desc(articleVersion.createdAt))
    .limit(1)

  return rows[0] ?? null
}
