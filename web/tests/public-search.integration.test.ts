import { beforeAll, describe, expect, it } from 'vitest'
import { searchPublicArticles } from '@/lib/public-library'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('public full-text search', () => {
  beforeAll(async () => {
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
        ) VALUES
          ('article-1', 'category-1', '写作不是归档', '写作不是归档', 1,
           '## 持续修订 Knowledge maintenance',
           '持续修订让知识长期维护 Knowledge maintenance',
           1, 'published', NOW(3), NOW(3)),
          ('article-draft', 'category-1', '未发布草稿', '未发布草稿', 2,
           '秘密草稿', '秘密草稿只应存在于写作台', 1, 'draft', NOW(3), NOW(3))`,
      )
      await connection.query(
        `INSERT INTO article_version (
          id, article_id, kind, title, category_id, category_slug, path,
          markdown, plain_text, author_id, author_name, author_role, created_at
        ) VALUES (
          'version-1', 'article-1', 'published', '写作不是归档', 'category-1',
          'attention-and-writing', '写作不是归档', '## 持续修订',
          '持续修订让知识长期维护 Knowledge maintenance',
          'owner-1', '小多', 'owner', NOW(3)
        )`,
      )
    } finally {
      await connection.end()
    }
  })

  it('finds Chinese content from published versions', async () => {
    const results = await searchPublicArticles('持续修订')
    expect(results.map((item) => item.title)).toContain('写作不是归档')
  })

  it('finds English content and never returns drafts', async () => {
    const results = await searchPublicArticles('maintenance')
    expect(results.map((item) => item.title)).toContain('写作不是归档')
    const hidden = await searchPublicArticles('秘密草稿')
    expect(hidden).toEqual([])
  })
})
