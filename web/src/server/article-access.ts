import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  article,
  articleGrant,
  category,
  user,
} from '@/db/schema'
import type { ArticleDraft } from '@/server/articles'
import { createNotification } from '@/server/notifications'

export interface StudioActor {
  id: string
  role: 'owner' | 'collaborator'
}

export function studioActorFromUser(user: {
  id: string
  role: string
}): StudioActor {
  return {
    id: user.id,
    role: user.role === 'owner' ? 'owner' : 'collaborator',
  }
}

export interface AccessibleCategory {
  id: string
  title: string
  slug: string
  position: number
}

export interface GrantableCollaborator {
  id: string
  name: string
  email: string
}

export interface ArticleGrantRecord {
  userId: string
  userName: string
  articleId: string
  articleTitle: string
}

const articleColumns = {
  id: article.id,
  title: article.title,
  categoryId: article.categoryId,
  categoryTitle: category.title,
  categorySlug: category.slug,
  path: article.path,
  position: article.position,
  contentJson: article.contentJson,
  sourceFileName: article.sourceFileName,
  markdown: article.markdown,
  plainText: article.plainText,
  revision: article.revision,
  publicationState: article.publicationState,
  trashedAt: article.trashedAt,
  trashedById: article.trashedById,
  trashedByName: article.trashedByName,
  updatedAt: article.updatedAt,
} as const

export async function listAccessibleArticles(
  actor: StudioActor,
): Promise<ArticleDraft[]> {
  if (actor.role === 'owner') {
    return db
      .select(articleColumns)
      .from(article)
      .innerJoin(category, eq(article.categoryId, category.id))
      .where(isNull(article.trashedAt))
      .orderBy(asc(category.position), asc(article.position), asc(article.id))
  }

  return db
    .select(articleColumns)
    .from(article)
    .innerJoin(category, eq(article.categoryId, category.id))
    .innerJoin(
      articleGrant,
      and(
        eq(articleGrant.articleId, article.id),
        eq(articleGrant.userId, actor.id),
      ),
    )
    .where(isNull(article.trashedAt))
    .orderBy(asc(category.position), asc(article.position), asc(article.id))
}

export async function getAccessibleArticle(
  actor: StudioActor,
  articleId: string,
): Promise<ArticleDraft | null> {
  if (actor.role === 'owner') {
    const [record] = await db
      .select(articleColumns)
      .from(article)
      .innerJoin(category, eq(article.categoryId, category.id))
      .where(and(eq(article.id, articleId), isNull(article.trashedAt)))
      .limit(1)
    return record ?? null
  }

  const [record] = await db
    .select(articleColumns)
    .from(article)
    .innerJoin(category, eq(article.categoryId, category.id))
    .innerJoin(
      articleGrant,
      and(
        eq(articleGrant.articleId, article.id),
        eq(articleGrant.userId, actor.id),
      ),
    )
    .where(and(eq(article.id, articleId), isNull(article.trashedAt)))
    .limit(1)
  return record ?? null
}

export async function listAccessibleCategories(
  actor: StudioActor,
): Promise<AccessibleCategory[]> {
  if (actor.role === 'owner') {
    return db
      .select({
        id: category.id,
        title: category.title,
        slug: category.slug,
        position: category.position,
      })
      .from(category)
      .orderBy(asc(category.position), asc(category.id))
  }

  return db
    .selectDistinct({
      id: category.id,
      title: category.title,
      slug: category.slug,
      position: category.position,
    })
    .from(category)
    .innerJoin(article, eq(article.categoryId, category.id))
    .innerJoin(
      articleGrant,
      and(
        eq(articleGrant.articleId, article.id),
        eq(articleGrant.userId, actor.id),
      ),
    )
    .where(isNull(article.trashedAt))
    .orderBy(asc(category.position), asc(category.id))
}

export async function grantArticle(input: {
  userId: string
  articleId: string
}) {
  const [collaborator] = await db
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        eq(user.id, input.userId),
        eq(user.role, 'collaborator'),
        eq(user.status, 'active'),
      ),
    )
    .limit(1)
  if (!collaborator) throw new Error('COLLABORATOR_NOT_FOUND')

  const [target] = await db
    .select({ id: article.id })
    .from(article)
    .where(and(eq(article.id, input.articleId), isNull(article.trashedAt)))
    .limit(1)
  if (!target) throw new Error('ARTICLE_NOT_FOUND')

  const result = await db
    .insert(articleGrant)
    .values(input)
    .onDuplicateKeyUpdate({ set: { articleId: input.articleId } })
  if (result[0].affectedRows === 1) {
    await createNotification({
      eventKey: `grant:added:${input.userId}:${input.articleId}`,
      kind: 'grant',
      title: '文章授权已增加',
      body: `已为协作者增加文章 ${input.articleId} 的编辑授权`,
      href: '/studio/collaboration',
    })
  }
}

export async function revokeArticleGrant(input: {
  userId: string
  articleId: string
}) {
  const result = await db
    .delete(articleGrant)
    .where(
      and(
        eq(articleGrant.userId, input.userId),
        eq(articleGrant.articleId, input.articleId),
      ),
    )
  if (result[0].affectedRows > 0) {
    await createNotification({
      eventKey: `grant:removed:${input.userId}:${input.articleId}`,
      kind: 'grant',
      title: '文章授权已撤销',
      body: `已撤销协作者对文章 ${input.articleId} 的编辑授权`,
      href: '/studio/collaboration',
    })
  }
}

export async function listGrantableCollaborators(): Promise<
  GrantableCollaborator[]
> {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(
      and(eq(user.role, 'collaborator'), eq(user.status, 'active')),
    )
    .orderBy(asc(user.name), asc(user.email))
}

export async function listArticleGrants(): Promise<ArticleGrantRecord[]> {
  return db
    .select({
      userId: articleGrant.userId,
      userName: user.name,
      articleId: articleGrant.articleId,
      articleTitle: article.title,
    })
    .from(articleGrant)
    .innerJoin(user, eq(articleGrant.userId, user.id))
    .innerJoin(article, eq(articleGrant.articleId, article.id))
    .where(and(eq(user.role, 'collaborator'), isNull(article.trashedAt)))
    .orderBy(asc(user.name), asc(article.position), asc(article.id))
}
