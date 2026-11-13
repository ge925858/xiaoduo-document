import { beforeEach, describe, expect, it } from 'vitest'
import {
  getArticleDraft,
  listArticleVersions,
  listTrash,
  permanentlyDeleteArticle,
  publishArticle,
  purgeExpiredTrash,
  restoreTrashArticle,
  trashArticle,
} from '@/server/articles'
import { deleteCategory } from '@/server/categories'
import { getPublicChapterByPath } from '@/lib/public-library'
import { createTestConnection, resetTestDatabase } from './test-db'

const actor = { id: 'owner-1', name: '小多', role: 'owner' as const }

describe('trash lifecycle', () => {
  beforeEach(async () => {
    await resetTestDatabase()
    const connection = await createTestConnection()
    try {
      await connection.query(
        `INSERT INTO category (id, title, slug, position)
         VALUES ('category-1', '注意力与写作', 'attention-and-writing', 1)`,
      )
      await connection.query(
        `INSERT INTO article (
          id, category_id, title, path, position, markdown, plain_text,
          revision, publication_state, created_at, updated_at
        ) VALUES (
          'article-1', 'category-1', '写作不是归档', '写作不是归档', 1,
          '## 初稿', '初稿', 1, 'draft', NOW(3), NOW(3)
        )`,
      )
    } finally {
      await connection.end()
    }
    await publishArticle('article-1', actor)
  })

  it('trashes, restores, and permanently deletes an article with versions', async () => {
    expect(await trashArticle('article-1', actor)).toBe(true)
    expect(
      await getPublicChapterByPath('attention-and-writing', '写作不是归档'),
    ).toBeNull()
    expect(await listTrash()).toHaveLength(1)
    expect(await deleteCategory('category-1')).toBe(false)

    expect(await restoreTrashArticle('article-1')).toBe(true)
    expect((await getArticleDraft('article-1'))?.publicationState).toBe(
      'unpublished',
    )

    expect(await permanentlyDeleteArticle('article-1')).toBe(true)
    expect(await getArticleDraft('article-1')).toBeNull()
    expect(await listArticleVersions('article-1')).toHaveLength(0)
  })

  it('purges only trash older than 30 days', async () => {
    const connection = await createTestConnection()
    try {
      await connection.query(
        `UPDATE article SET trashed_at = DATE_SUB(NOW(3), INTERVAL 31 DAY),
          trashed_by_id = 'owner-1', trashed_by_name = '小多'
         WHERE id = 'article-1'`,
      )
    } finally {
      await connection.end()
    }
    expect(await purgeExpiredTrash()).toBe(1)
    expect(await getArticleDraft('article-1')).toBeNull()
  })
})
