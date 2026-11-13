import { beforeEach, describe, expect, it } from 'vitest'
import {
  getAccessibleArticle,
  grantArticle,
  listAccessibleArticles,
  listAccessibleCategories,
  revokeArticleGrant,
} from '@/server/article-access'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('article grants and scoped studio access', () => {
  beforeEach(async () => {
    await resetTestDatabase()
    const connection = await createTestConnection()
    try {
      await connection.query(
        `INSERT INTO category (id, title, slug, position) VALUES
          ('category-1', '注意力与写作', 'attention-and-writing', 1),
          ('category-2', '工具与方法', 'tools', 2)`,
      )
      await connection.query(
        `INSERT INTO article (
          id, category_id, title, path, position, markdown, plain_text,
          revision, publication_state, created_at, updated_at
        ) VALUES
          ('article-1', 'category-1', '写作不是归档', '写作不是归档', 1,
           '正文一', '正文一', 1, 'draft', NOW(3), NOW(3)),
          ('article-2', 'category-1', '长期维护', '长期维护', 2,
           '正文二', '正文二', 1, 'published', NOW(3), NOW(3)),
          ('article-3', 'category-2', '工具边界', '工具边界', 1,
           '正文三', '正文三', 1, 'draft', NOW(3), NOW(3))`,
      )
      await connection.query(
        `INSERT INTO auth_user (
          id, name, email, email_verified, role, status, created_at, updated_at
        ) VALUES
          ('owner-1', '站主', 'owner@example.com', true, 'owner', 'active',
           NOW(3), NOW(3)),
          ('collaborator-1', '协作者甲', 'collab@example.com', true,
           'collaborator', 'active', NOW(3), NOW(3))`,
      )
    } finally {
      await connection.end()
    }
  })

  it('scopes articles and categories to grants and revokes access immediately', async () => {
    const owner = { id: 'owner-1', role: 'owner' as const }
    const collaborator = {
      id: 'collaborator-1',
      role: 'collaborator' as const,
    }
    expect(
      (await listAccessibleArticles(owner)).map((item) => item.id),
    ).toEqual(['article-1', 'article-2', 'article-3'])
    await grantArticle({
      userId: collaborator.id,
      articleId: 'article-1',
    })

    expect(
      (await listAccessibleArticles(collaborator)).map((item) => item.id),
    ).toEqual(['article-1'])
    expect(
      (await listAccessibleCategories(collaborator)).map((item) => item.id),
    ).toEqual(['category-1'])

    await revokeArticleGrant({
      userId: collaborator.id,
      articleId: 'article-1',
    })
    expect(await listAccessibleArticles(collaborator)).toEqual([])
    expect(await listAccessibleCategories(collaborator)).toEqual([])
    expect(await getAccessibleArticle(collaborator, 'article-1')).toBeNull()
  })
})
