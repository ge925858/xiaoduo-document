import { beforeAll, describe, expect, it } from 'vitest'
import {
  getPublicChapterNavigation,
  listPublicLibrary,
} from '@/lib/public-library'
import { createTestConnection, resetTestDatabase } from './test-db'

describe('public library navigation', () => {
  beforeAll(async () => {
    await resetTestDatabase()
    const connection = await createTestConnection()
    try {
      await connection.query(
        `INSERT INTO category (id, title, slug, position) VALUES
          ('category-2', '工具与方法', 'tools', 2),
          ('category-1', '注意力与写作', 'attention-and-writing', 1),
          ('category-empty', '空分类', 'empty', 3)`,
      )
      await connection.query(
        `INSERT INTO article (
          id, category_id, title, path, position, markdown, plain_text,
          revision, publication_state, created_at, updated_at
        ) VALUES
          ('article-2', 'category-1', '长期维护', '长期维护', 2,
           '## 第二节', '第二节', 1, 'published', NOW(3), NOW(3)),
          ('article-1', 'category-1', '写作不是归档', '写作不是归档', 1,
           '## 第一节', '第一节', 1, 'published', NOW(3), NOW(3)),
          ('article-3', 'category-2', '工具清单', '工具清单', 1,
           '## 工具', '工具', 1, 'published', NOW(3), NOW(3)),
          ('article-draft', 'category-1', '未发布草稿', '未发布草稿', 3,
           '草稿', '草稿', 1, 'draft', NOW(3), NOW(3))`,
      )
      await connection.query(
        `INSERT INTO article_version (
          id, article_id, kind, title, category_id, path, markdown, plain_text,
          author_id, author_name, author_role, created_at
        ) VALUES
          ('version-2', 'article-2', 'published', '长期维护', 'category-1',
           '长期维护', '## 第二节', '第二节', 'owner-1', '小多', 'owner', NOW(3)),
          ('version-1', 'article-1', 'published', '写作不是归档', 'category-1',
           '写作不是归档', '## 第一节', '第一节', 'owner-1', '小多', 'owner', NOW(3)),
          ('version-3', 'article-3', 'published', '工具清单', 'category-2',
           '工具清单', '## 工具', '工具', 'owner-1', '小多', 'owner', NOW(3))`,
      )
    } finally {
      await connection.end()
    }
  })

  it('returns only public categories and chapters in manual order', async () => {
    const library = await listPublicLibrary()
    expect(library.map((item) => item.slug)).toEqual([
      'attention-and-writing',
      'tools',
    ])
    expect(library[0].chapters.map((item) => item.title)).toEqual([
      '写作不是归档',
      '长期维护',
    ])
  })

  it('derives previous and next chapters from the current category', async () => {
    const navigation = await getPublicChapterNavigation(
      'attention-and-writing',
      '写作不是归档',
    )
    expect(navigation?.previous).toBeNull()
    expect(navigation?.next?.title).toBe('长期维护')
  })
})
