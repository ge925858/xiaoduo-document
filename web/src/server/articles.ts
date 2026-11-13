import { and, asc, desc, eq } from 'drizzle-orm'
import type { JSONContent } from '@tiptap/core'
import { db } from '@/db/client'
import { article, articleVersion, category } from '@/db/schema'

export interface ArticleDraft {
  id: string
  title: string
  categoryId: string
  categoryTitle: string
  path: string
  position: number
  contentJson: string | null
  markdown: string
  plainText: string
  revision: number
  publicationState: 'draft' | 'published' | 'unpublished'
  trashedAt: string | null
  updatedAt: string
}

export interface SaveArticleDraftInput {
  title: string
  categoryId: string
  contentJson: JSONContent
  markdown: string
  plainText: string
  expectedRevision: number
}

export interface ArticleVersionRecord {
  id: string
  articleId: string
  kind: 'manual' | 'published'
  title: string
  categoryId: string | null
  path: string
  label: string | null
  contentJson: string | null
  markdown: string
  plainText: string
  authorId: string
  authorName: string
  authorRole: 'owner' | 'collaborator'
  createdAt: string
}

export interface VersionActor {
  id: string
  name: string
  role: 'owner' | 'collaborator'
}

export function chapterPathFromTitle(title: string): string {
  return title
    .normalize('NFC')
    .trim()
    .replace(/[/\\?#%]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled'
}

async function uniquePath(
  categoryId: string,
  title: string,
  excludeId?: string,
) {
  const base = chapterPathFromTitle(title)
  const rows = await db
    .select({ id: article.id, path: article.path })
    .from(article)
    .where(eq(article.categoryId, categoryId))
  const existing = new Set(
    rows
      .filter((row) => row.id !== excludeId)
      .map((row) => row.path),
  )
  if (!existing.has(base)) return base
  let suffix = 2
  while (existing.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export async function listArticleDrafts(): Promise<ArticleDraft[]> {
  return db
    .select({
      id: article.id,
      title: article.title,
      categoryId: article.categoryId,
      categoryTitle: category.title,
      path: article.path,
      position: article.position,
      contentJson: article.contentJson,
      markdown: article.markdown,
      plainText: article.plainText,
      revision: article.revision,
      publicationState: article.publicationState,
      trashedAt: article.trashedAt,
      updatedAt: article.updatedAt,
    })
    .from(article)
    .innerJoin(category, eq(article.categoryId, category.id))
    .orderBy(asc(category.position), asc(article.position), asc(article.id))
}

export async function getArticleDraft(id: string): Promise<ArticleDraft | null> {
  const rows = await db
    .select({
      id: article.id,
      title: article.title,
      categoryId: article.categoryId,
      categoryTitle: category.title,
      path: article.path,
      position: article.position,
      contentJson: article.contentJson,
      markdown: article.markdown,
      plainText: article.plainText,
      revision: article.revision,
      publicationState: article.publicationState,
      trashedAt: article.trashedAt,
      updatedAt: article.updatedAt,
    })
    .from(article)
    .innerJoin(category, eq(article.categoryId, category.id))
    .where(eq(article.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function createArticleDraft(input: {
  categoryId: string
  title: string
}): Promise<ArticleDraft> {
  const [targetCategory] = await db
    .select({ id: category.id })
    .from(category)
    .where(eq(category.id, input.categoryId))
    .limit(1)
  if (!targetCategory) throw new Error('CATEGORY_NOT_FOUND')

  const existing = await listArticleDrafts()
  const categoryArticles = existing.filter(
    (item) => item.categoryId === input.categoryId,
  )
  const title = input.title.trim() || '无标题章节'
  const created = {
    id: crypto.randomUUID(),
    categoryId: input.categoryId,
    title,
    path: await uniquePath(input.categoryId, title),
    position: (categoryArticles.at(-1)?.position ?? 0) + 1,
    markdown: '',
    plainText: '',
    contentJson: JSON.stringify({ type: 'doc', content: [] }),
    revision: 1,
  }
  await db.insert(article).values(created)
  const result = await getArticleDraft(created.id)
  if (!result) throw new Error('CREATE_FAILED')
  return result
}

export async function saveArticleDraft(
  id: string,
  input: SaveArticleDraftInput,
): Promise<'saved' | 'conflict' | 'missing'> {
  const current = await getArticleDraft(id)
  if (!current) return 'missing'
  if (current.revision !== input.expectedRevision) return 'conflict'

  const [destination] = await db
    .select({ id: category.id })
    .from(category)
    .where(eq(category.id, input.categoryId))
    .limit(1)
  if (!destination) return 'missing'

  const title = input.title.trim() || '无标题章节'
  let position = current.position
  if (current.categoryId !== input.categoryId) {
    const destinationArticles = (await listArticleDrafts()).filter(
      (item) => item.categoryId === input.categoryId,
    )
    position = (destinationArticles.at(-1)?.position ?? 0) + 1
  }

  const result = await db
    .update(article)
    .set({
      title,
      categoryId: input.categoryId,
      path: await uniquePath(input.categoryId, title, id),
      position,
      contentJson: JSON.stringify(input.contentJson),
      markdown: input.markdown,
      plainText: input.plainText,
      revision: current.revision + 1,
      updatedAt: new Date().toISOString().slice(0, 23).replace('T', ' '),
    })
    .where(and(eq(article.id, id), eq(article.revision, input.expectedRevision)))

  return result[0].affectedRows === 1 ? 'saved' : 'conflict'
}

export async function moveArticleDraft(
  id: string,
  direction: -1 | 1,
): Promise<boolean> {
  const current = await getArticleDraft(id)
  if (!current) return false
  const siblings = (await listArticleDrafts()).filter(
    (item) => item.categoryId === current.categoryId,
  )
  const index = siblings.findIndex((item) => item.id === id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= siblings.length) return false

  const reordered = [...siblings]
  ;[reordered[index], reordered[target]] = [
    reordered[target],
    reordered[index],
  ]
  await db.transaction(async (transaction) => {
    for (const [position, item] of reordered.entries()) {
      await transaction
        .update(article)
        .set({ position: position + 1 })
        .where(eq(article.id, item.id))
    }
  })
  return true
}

export async function listArticleVersions(
  articleId: string,
): Promise<ArticleVersionRecord[]> {
  return db
    .select({
      id: articleVersion.id,
      articleId: articleVersion.articleId,
      kind: articleVersion.kind,
      title: articleVersion.title,
      categoryId: articleVersion.categoryId,
      path: articleVersion.path,
      label: articleVersion.label,
      contentJson: articleVersion.contentJson,
      markdown: articleVersion.markdown,
      plainText: articleVersion.plainText,
      authorId: articleVersion.authorId,
      authorName: articleVersion.authorName,
      authorRole: articleVersion.authorRole,
      createdAt: articleVersion.createdAt,
    })
    .from(articleVersion)
    .where(eq(articleVersion.articleId, articleId))
    .orderBy(desc(articleVersion.createdAt), desc(articleVersion.id))
}

export async function saveManualVersion(
  articleId: string,
  input: { label?: string; actor: VersionActor },
): Promise<ArticleVersionRecord> {
  const current = await getArticleDraft(articleId)
  if (!current) throw new Error('ARTICLE_NOT_FOUND')
  const id = crypto.randomUUID()
  await db.insert(articleVersion).values({
    id,
    articleId,
    kind: 'manual',
    title: current.title,
    categoryId: current.categoryId,
    path: current.path,
    label: input.label?.trim() || null,
    contentJson: current.contentJson,
    markdown: current.markdown,
    plainText: current.plainText,
    authorId: input.actor.id,
    authorName: input.actor.name,
    authorRole: input.actor.role,
  })
  const version = (await listArticleVersions(articleId)).find(
    (item) => item.id === id,
  )
  if (!version) throw new Error('VERSION_CREATE_FAILED')
  return version
}

export async function restoreArticleVersion(
  articleId: string,
  versionId: string,
): Promise<'saved' | 'conflict' | 'missing'> {
  const current = await getArticleDraft(articleId)
  if (!current) return 'missing'
  const [version] = await db
    .select()
    .from(articleVersion)
    .where(
      and(
        eq(articleVersion.id, versionId),
        eq(articleVersion.articleId, articleId),
      ),
    )
    .limit(1)
  if (!version) return 'missing'

  const categoryId = version.categoryId ?? current.categoryId
  const result = await db
    .update(article)
    .set({
      title: version.title,
      categoryId,
      path: await uniquePath(categoryId, version.title, articleId),
      contentJson: version.contentJson,
      markdown: version.markdown,
      plainText: version.plainText,
      revision: current.revision + 1,
      updatedAt: new Date().toISOString().slice(0, 23).replace('T', ' '),
    })
    .where(
      and(
        eq(article.id, articleId),
        eq(article.revision, current.revision),
      ),
    )
  return result[0].affectedRows === 1 ? 'saved' : 'conflict'
}
